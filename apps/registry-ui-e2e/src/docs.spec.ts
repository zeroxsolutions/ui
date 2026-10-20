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
    ['Switch', 'switch'],
    ['Tabs', 'tabs'],
  ]) {
    // The last of its name: the web docs' own Installation is listed above the native group.
    await expect(sidebar.getByRole('link', { name, exact: true }).last()).toHaveAttribute(
      'href',
      `/docs/native/${slug}`,
    );
  }
});
