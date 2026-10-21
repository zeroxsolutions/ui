import { expect, test } from './test/fixtures';

test('/docs renders the introduction page', async ({ page }) => {
  await page.goto('/docs');

  await expect(page.getByRole('heading', { level: 1, name: 'Introduction' })).toBeVisible();
});

test("a docs page's title carries the site's suffix", async ({ page }) => {
  await page.goto('/docs');

  await expect(page).toHaveTitle('Introduction - ZUI');
});

test('the Web / Native switch opens the native docs, whose pages the sidebar lists', async ({ page }) => {
  await page.goto('/docs');
  await page.getByRole('navigation', { name: 'Platform' }).getByRole('link', { name: 'Native', exact: true }).click();

  await expect(page).toHaveURL(/\/native\/docs$/);
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

test('the native installation names a vega and a nova style for each engine', async ({ page }) => {
  await page.goto('/native/docs/installation');

  const article = page.getByRole('main');
  for (const style of ['nativewind-vega', 'nativewind-nova', 'uniwind-vega', 'uniwind-nova']) {
    await expect(article.getByText(style, { exact: true }).first()).toBeVisible();
  }
});

test("the native installation's Uniwind tab says how to write Uniwind's types before a typecheck", async ({ page }) => {
  await page.goto('/native/docs/installation');

  await page.getByRole('tab', { name: 'Uniwind', exact: true }).first().click();

  await expect(page.getByText('npx uniwind generate-artifacts --css ./global.css')).toBeVisible();
});
