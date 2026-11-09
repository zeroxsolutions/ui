import { expect, test } from './test/fixtures';

test("the native docs' sidebar lists their pages and the components under the default engine", async ({ page }) => {
  await page.goto('/native/docs');

  await expect(page.getByRole('heading', { level: 1, name: 'Introduction' })).toBeVisible();
  const sidebar = page.getByRole('navigation', { name: 'Docs' });
  await expect(sidebar.getByRole('link', { name: 'Installation', exact: true })).toHaveAttribute(
    'href',
    '/native/docs/installation',
  );
  for (const [name, slug] of [
    ['Components', ''],
    ['Theme', '/theme'],
    ['Text', '/text'],
    ['Icon', '/icon'],
    ['Button', '/button'],
    ['Input group', '/input-group'],
    ['Input OTP', '/input-otp'],
    ['Code input', '/code-input'],
    ['Password input', '/password-input'],
    ['Password strength', '/password-strength'],
    ['Switch', '/switch'],
    ['Spinner', '/spinner'],
    ['Unsaved changes toolbar', '/unsaved-changes-toolbar'],
    ['Tabs', '/tabs'],
    ['Tab bar', '/tab-bar'],
    ['Status indicator', '/status-indicator'],
    ['Unsaved indicator', '/unsaved-indicator'],
    ['Icon media', '/icon-media'],
    ['Icon label', '/icon-label'],
    ['Center', '/center'],
    ['Page container', '/page-container'],
    ['Panel header', '/panel-header'],
    ['Panel row', '/panel-row'],
    ['Panel field group', '/panel-field-group'],
    ['Collapsible card', '/collapsible-card'],
    ['Reasoning collapsible', '/reasoning-collapsible'],
    ['Copy button', '/copy-button'],
    ['File type icon', '/file-type-icon'],
    ['Font preview', '/font-preview'],
    ['Image preview', '/image-preview'],
  ]) {
    await expect(sidebar.getByRole('link', { name, exact: true })).toHaveAttribute(
      'href',
      `/native/components/nativewind${slug}`,
    );
  }
});

test('an item page of each native section renders with its install command', async ({ page }) => {
  for (const [title, slug] of [
    ['Theme', 'theme'],
    ['Button', 'button'],
    ['Input OTP', 'input-otp'],
    ['Progress', 'progress'],
    ['Tabs', 'tabs'],
  ]) {
    await page.goto(`/native/components/nativewind/${slug}`);

    await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
    await expect(page.getByText(`add @zui/${slug}`).first()).toBeVisible();
  }
});

test('the native installation names the style for each engine', async ({ page }) => {
  await page.goto('/native/docs/installation');

  const article = page.getByRole('main');
  for (const style of ['nativewind-<style>', 'uniwind-<style>']) {
    await expect(article.getByText(style, { exact: true }).first()).toBeVisible();
  }
});

test("the native installation's Uniwind tab says how to write Uniwind's types before a typecheck", async ({ page }) => {
  await page.goto('/native/docs/installation');

  await page.getByRole('tab', { name: 'Uniwind', exact: true }).first().click();

  await expect(page.getByText('npx uniwind generate-artifacts --css ./global.css')).toBeVisible();
});

test("a native docs page's code block is highlighted, its tokens in more than one colour", async ({ page }) => {
  await page.goto('/native/docs/installation');

  const block = page.getByRole('main').getByRole('code').filter({ hasText: 'module.exports' }).first();
  await expect
    .poll(async () => {
      const tokens = await block.locator('span[style]').all();
      return new Set(await Promise.all(tokens.map((token) => token.getAttribute('style')))).size;
    })
    .toBeGreaterThan(1);
});

test("the native docs' chrome stays in Nova whatever native style is picked", async ({ page }) => {
  await page.goto('/native/docs/installation?style=lyra');
  await expect(page.locator('html')).toHaveClass(/\bstyle-nova\b/);
  await expect(page.locator('html')).not.toHaveClass(/\bstyle-lyra\b/);
});
