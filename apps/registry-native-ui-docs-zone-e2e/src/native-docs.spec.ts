import { expect, test } from './test/fixtures';
import { componentPageSlugs, componentPageTitle } from './test/native-pages';

test("the native docs' sidebar lists their pages and every component page under the default engine", async ({
  page,
}) => {
  await page.goto('/native/docs');

  await expect(page.getByRole('heading', { level: 1, name: 'Introduction' })).toBeVisible();
  const sidebar = page.getByRole('navigation', { name: 'Docs' });
  await expect(sidebar.getByRole('link', { name: 'Installation', exact: true })).toHaveAttribute(
    'href',
    '/native/docs/installation',
  );
  await expect(sidebar.getByRole('link', { name: 'Components', exact: true })).toHaveAttribute(
    'href',
    '/native/components/nativewind',
  );
  for (const slug of componentPageSlugs) {
    await expect(sidebar.getByRole('link', { name: componentPageTitle(slug), exact: true }), slug).toHaveAttribute(
      'href',
      `/native/components/nativewind/${slug}`,
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
