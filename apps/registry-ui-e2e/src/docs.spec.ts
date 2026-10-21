import { expect, test } from './test/fixtures';

test('/docs renders the introduction page', async ({ page }) => {
  await page.goto('/docs');

  await expect(page.getByRole('heading', { level: 1, name: 'Introduction' })).toBeVisible();
});

test("a docs page's title carries the site's suffix", async ({ page }) => {
  await page.goto('/docs');

  await expect(page).toHaveTitle('Introduction - ZUI');
});

test("the header's Native link opens the native docs, whose pages the sidebar lists", async ({ page }) => {
  await page.goto('/docs');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Native', exact: true }).click();

  await expect(page).toHaveURL(/\/docs\/native$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Native' })).toBeVisible();
  const sidebar = page.getByRole('navigation', { name: 'Docs' });
  await expect(sidebar.getByText('Native', { exact: true })).toBeVisible();
  for (const [name, slug] of [
    ['Installation', 'installation'],
    ['Theme', 'theme'],
    ['Text', 'text'],
    ['Icon', 'icon'],
    ['Button', 'button'],
    ['Input group', 'input-group'],
    ['Input OTP', 'input-otp'],
    ['Code input', 'code-input'],
    ['Password input', 'password-input'],
    ['Password strength', 'password-strength'],
    ['Switch', 'switch'],
    ['Spinner', 'spinner'],
    ['Unsaved changes toolbar', 'unsaved-changes-toolbar'],
    ['Tabs', 'tabs'],
    ['Tab bar', 'tab-bar'],
  ]) {
    // The last of its name: the web docs' own Installation is listed above the native group.
    await expect(sidebar.getByRole('link', { name, exact: true }).last()).toHaveAttribute(
      'href',
      `/docs/native/${slug}`,
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
    await page.goto(`/docs/native/${slug}`);

    await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
    await expect(page.getByText(`add @zui/${slug}`).first()).toBeVisible();
  }
});

test('the native installation names a vega and a nova style for each engine', async ({ page }) => {
  await page.goto('/docs/native/installation');

  const article = page.getByRole('main');
  for (const style of ['nativewind-vega', 'nativewind-nova', 'uniwind-vega', 'uniwind-nova']) {
    await expect(article.getByText(style, { exact: true }).first()).toBeVisible();
  }
});

test("the native installation's Uniwind tab says how to write Uniwind's types before a typecheck", async ({ page }) => {
  await page.goto('/docs/native/installation');

  await page.getByRole('tab', { name: 'Uniwind', exact: true }).first().click();

  await expect(page.getByText('npx uniwind generate-artifacts --css ./global.css')).toBeVisible();
});
