import { expect, test } from './test/fixtures';
import { DRAWN, inside } from './test/native-preview';

const COMPONENTS = '/native/components/nativewind';

test.slow(true, 'a frame may take all of DRAWN to draw, outlasting the default');

test('a chat suggestion whose caller prevents the default keeps its prompt, and another hands its prompt over', async ({
  page,
}) => {
  await page.goto(`${COMPONENTS}/chat-suggestion-item`);
  const demo = inside(page, 'Chat suggestion item demo');

  await demo.getByRole('button', { name: 'Summarise this document' }).click(DRAWN);
  await expect(demo.getByText('Open a document to summarise it', { exact: true })).toBeVisible();

  await demo.getByRole('button', { name: 'Suggest three ideas' }).click();
  await expect(demo.getByText('Sent: "Suggest three ideas"', { exact: true })).toBeVisible();
});

test('a copy button copies, and copies nothing while its caller prevents the default', async ({ page }) => {
  // Reading the clipboard back needs a permission only Chromium grants, so each frame keeps what it was handed.
  await page.addInitScript(`(() => {
    const writeText = Clipboard.prototype.writeText;
    window.handedToClipboard = [];
    Clipboard.prototype.writeText = function (text) {
      window.handedToClipboard.push(text);
      return writeText.call(this, text);
    };
  })()`);
  await page.goto(`${COMPONENTS}/copy-button`);
  const demo = inside(page, 'Copy button demo');
  const handedToClipboard = (): Promise<string[]> =>
    demo.locator('body').evaluate<string[]>('window.handedToClipboard');

  await demo.getByRole('button', { name: 'Copy token', exact: true }).click(DRAWN);
  await expect(demo.getByText('Show the token to copy it', { exact: true })).toBeVisible();

  await demo.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(demo.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
  await expect.poll(handedToClipboard).toEqual(['pnpm add @zeroxsolutions/icons']);

  await demo.getByRole('button', { name: 'Show', exact: true }).click();
  await demo.getByRole('button', { name: 'Copy token', exact: true }).click();
  await expect(demo.getByRole('button', { name: 'Token copied', exact: true })).toBeVisible();
  await expect.poll(handedToClipboard).toEqual(['pnpm add @zeroxsolutions/icons', 'zx_live_4f9c2a7e']);
});

test('a number field steps on the arrows, and Escape drops the draft and keeps the last value', async ({ page }) => {
  await page.goto(`${COMPONENTS}/number-field`);
  const width = inside(page, 'Number field demo').getByRole('textbox', { name: 'Width', exact: true });

  await expect(width).toHaveValue('320', DRAWN);
  await width.click();
  await width.press('ArrowUp');
  await expect(width).toHaveValue('321');
  await width.press('ArrowDown');
  await width.press('ArrowDown');
  await expect(width).toHaveValue('319');

  await width.fill('500');
  await width.press('Escape');

  await expect(width).not.toBeFocused();
  await expect(width).toHaveValue('319');
});

test('a tag input adds on return and keeps focus, removes the last tag on Backspace, and keeps a tag whose remove its caller prevents', async ({
  page,
}) => {
  await page.goto(`${COMPONENTS}/tag-input`);
  const demo = inside(page, 'Tag input demo');
  const field = demo.getByRole('textbox', { name: 'Add a tag', exact: true });

  await field.click(DRAWN);
  await field.fill('web');
  await field.press('Enter');
  await expect(demo.getByText('web', { exact: true })).toBeVisible();
  await expect(field).toHaveValue('');
  await expect(field).toBeFocused();

  await field.press('Backspace');
  await expect(demo.getByText('web', { exact: true })).toHaveCount(0);
  await expect(demo.getByText('ui', { exact: true })).toBeVisible();

  await demo.getByRole('button', { name: 'Remove design', exact: true }).click();
  await expect(demo.getByText('Press its X again to remove design', { exact: true })).toBeVisible();
  await expect(demo.getByText('design', { exact: true })).toBeVisible();

  await demo.getByRole('button', { name: 'Confirm removing design', exact: true }).click();
  await expect(demo.getByText('design', { exact: true })).toHaveCount(0);
});

test('an emoji swatch whose artwork the CDN refuses draws the glyph as text', async ({ page }) => {
  const grinning = String.fromCodePoint(0x1f600);
  await page.route('https://fluent-emoji.zeroxsolutions.com/**', (route) =>
    new URL(route.request().url()).pathname.startsWith('/3d/')
      ? route.fulfill({ status: 404 })
      : route.fulfill({
          contentType: 'image/svg+xml',
          body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>',
        }),
  );
  await page.goto(`${COMPONENTS}/emoji-appearance-toggle-group`);
  const demo = inside(page, 'Emoji appearance toggle group demo');

  // Only the 3D artwork is refused, so the one glyph drawn as text is the 3D swatch's.
  const group = demo.getByRole('radiogroup', { name: 'Emoji style', exact: true });
  await expect(group.getByText('3D', { exact: true })).toBeVisible(DRAWN);
  await expect(group.getByText(grinning, { exact: true })).toHaveCount(1);
});

test('a single-select toggle group reads as radios, the selected one checked', async ({ page }) => {
  await page.goto(`${COMPONENTS}/toggle-group`);
  const demo = inside(page, 'Toggle group demo');
  const left = demo.getByRole('radio', { name: 'Left', exact: true });
  const center = demo.getByRole('radio', { name: 'Center', exact: true });

  await expect(left).toHaveAttribute('aria-checked', 'true', DRAWN);
  await expect(center).toHaveAttribute('aria-checked', 'false');

  await center.click();

  await expect(center).toHaveAttribute('aria-checked', 'true');
  await expect(left).toHaveAttribute('aria-checked', 'false');
});
