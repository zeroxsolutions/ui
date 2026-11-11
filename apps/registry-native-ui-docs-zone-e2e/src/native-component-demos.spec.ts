import { type Locator } from '@playwright/test';

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

test('a file tree moves focus on the arrows, Home and End, opens and closes a folder on Right and Left, selects on Enter and Space, and keeps one row in the tab order', async ({
  page,
}) => {
  await page.goto(`${COMPONENTS}/file-tree`);
  const tree = inside(page, 'File tree demo').getByRole('tree', { name: 'Files', exact: true });
  const row = (name: string): Locator => tree.getByRole('treeitem', { name, exact: true });
  const src = row('src');
  const indexTs = row('index.ts');
  const readme = row('README.md');

  await expect(indexTs).toHaveAttribute('aria-selected', 'true', DRAWN);
  await tree.getByText('index.ts', { exact: true }).click();
  await expect(indexTs).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(row('util.ts')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(readme).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(row('util.ts')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(src).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(src).toBeFocused();
  await page.keyboard.press('End');
  await expect(readme).toBeFocused();

  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await expect(indexTs).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(indexTs).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(src).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(src).toHaveAttribute('aria-expanded', 'false');
  await expect(indexTs).toHaveCount(0);
  await expect(src).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(src).toHaveAttribute('aria-expanded', 'true');
  await expect(src).toBeFocused();

  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await expect(readme).toHaveAttribute('aria-selected', 'true');
  await expect(indexTs).toHaveAttribute('aria-selected', 'false');
  await page.keyboard.press('Home');
  await page.keyboard.press('Space');
  await expect(src).toHaveAttribute('aria-selected', 'true');
  await expect(src).toHaveAttribute('aria-expanded', 'false');
  await expect(readme).toHaveAttribute('aria-selected', 'false');

  // Only the row last moved to is in the tab order, so Tab leaves the tree from its first row.
  await page.keyboard.press('Tab');
  await expect(readme).not.toBeFocused();
  await expect(src).not.toBeFocused();
});

test('a tree row being renamed keeps its old name on Escape and takes the new one on return', async ({ page }) => {
  await page.goto(`${COMPONENTS}/tree-item`);
  const demo = inside(page, 'Tree item demo');
  const field = demo.getByRole('textbox', { name: 'New name for README.md', exact: true });

  await demo.getByRole('button', { name: 'Rename README.md', exact: true }).click(DRAWN);
  await expect(field).toBeFocused();
  await field.fill('NOTES.md');
  await field.press('Escape');
  await expect(field).toHaveCount(0);
  await expect(demo.getByText('README.md', { exact: true })).toBeVisible();
  await expect(demo.getByText('NOTES.md', { exact: true })).toHaveCount(0);

  await demo.getByRole('button', { name: 'Rename README.md', exact: true }).click();
  await field.fill('NOTES.md');
  await field.press('Enter');
  await expect(field).toHaveCount(0);
  await expect(demo.getByText('NOTES.md', { exact: true })).toBeVisible();
  await expect(demo.getByText('README.md', { exact: true })).toHaveCount(0);
});

test('a resize handle resizes on a drag past 4px and not under it, by its step on the arrows, and toggles on Enter and a double click', async ({
  page,
}) => {
  await page.goto(`${COMPONENTS}/resize-handle`);
  const demo = inside(page, 'Resize handle demo');
  const handle = demo.getByRole('separator', { name: 'Resize panel', exact: true });

  await expect(demo.getByText('Floating panel (160px)', { exact: true })).toBeVisible(DRAWN);
  const box = await handle.boundingBox();
  if (box === null) throw new Error('The resize handle is not drawn');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  for (const step of [1, 2, 3]) await page.mouse.move(x + step, y);
  await page.mouse.up();
  // A drag reports nothing on the move that crosses 4px, so the width follows the 20px after it.
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 5, y);
  await page.mouse.move(x + 25, y);
  await page.mouse.up();
  await expect(demo.getByText('Floating panel (180px)', { exact: true })).toBeVisible();

  await handle.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(demo.getByText('Floating panel (170px)', { exact: true })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(demo.getByText('Floating panel (190px)', { exact: true })).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(demo.getByText('Panel', { exact: true })).toBeVisible();
  await handle.dblclick();
  await expect(demo.getByText('Floating panel (190px)', { exact: true })).toBeVisible();
});

test('a column menu item whose caller prevents the default keeps the column, and another hides its column', async ({
  page,
}) => {
  await page.goto(`${COMPONENTS}/data-table-column-header`);
  const demo = inside(page, 'Data table column header demo');
  const nameHeader = demo.getByRole('button', { name: 'Name', exact: true });
  const sizeHeader = demo.getByRole('button', { name: 'Size', exact: true });

  await nameHeader.click(DRAWN);
  await demo.getByRole('menuitem', { name: 'Hide', exact: true }).click();
  await expect(demo.getByText('Every file has a name, so this column stays', { exact: true })).toBeVisible();
  await expect(nameHeader).toBeVisible();

  await sizeHeader.click();
  await demo.getByRole('menuitem', { name: 'Hide', exact: true }).click();
  await expect(sizeHeader).toHaveCount(0);
  await expect(nameHeader).toBeVisible();
});

test('the emoji nav scrolls the list to a category, and a typed search narrows the list and hides the nav', async ({
  page,
}) => {
  await page.goto(`${COMPONENTS}/emoji-picker`);
  const demo = inside(page, 'Emoji picker demo');
  const flags = demo.getByRole('radio', { name: 'Flags', exact: true });

  // The list mounts only the rows near the screen, so the last category is not drawn until the nav reaches it.
  await flags.click(DRAWN);
  await expect(demo.getByText('Flags', { exact: true })).toBeInViewport();
  await expect(demo.getByRole('button', { name: 'chequered flag', exact: true })).toBeInViewport();

  await demo.getByRole('textbox', { name: 'Search emoji', exact: true }).fill('pizza');
  await expect(flags).toHaveCount(0);
  await demo.getByRole('button', { name: 'pizza', exact: true }).click();
  await expect(demo.getByText('Picked: \u{1F355}', { exact: true })).toBeVisible();

  await demo.getByRole('textbox', { name: 'Search emoji', exact: true }).fill('no such emoji');
  await expect(demo.getByText('No emoji found', { exact: true })).toBeVisible();
});

test('an avatar takes an image picked from the file dialog, and a colour typed as hex', async ({ page }) => {
  await page.goto(`${COMPONENTS}/avatar-picker`);
  const demo = inside(page, 'Avatar picker demo');

  await demo.getByRole('button', { name: 'Edit avatar', exact: true }).click(DRAWN);
  await demo.getByRole('tab', { name: 'Upload', exact: true }).click();
  const chooser = page.waitForEvent('filechooser');
  await demo.getByRole('button', { name: 'Choose image', exact: true }).click();
  // A 1x1 PNG.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  await (await chooser).setFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: png });
  await expect(demo.getByRole('button', { name: 'Replace image', exact: true })).toBeVisible();

  await demo.getByRole('tab', { name: 'Color', exact: true }).click();
  await demo.getByRole('textbox', { name: 'Custom', exact: true }).fill('#0EA5E9');
  await expect(demo.getByRole('button', { name: '#0ea5e9', exact: true })).toHaveAttribute('aria-selected', 'true');
});
