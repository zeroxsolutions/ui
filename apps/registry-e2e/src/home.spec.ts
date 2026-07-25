import { test, expect } from '@playwright/test';

/**
 * Root smoke: the registry index renders the catalog and links into a
 * component preview. The catalog groups items by category and labels each row
 * with its registry `type` (Decision 3); the link into Button is the
 * navigation seam the rest of the suite drives against.
 */
test('home renders the catalog and links to the button preview', async ({
  page,
}) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: '@zeroxsolutions/ui registry' })
  ).toBeVisible();

  // The Button row is the navigation seam into the doc page. The link's
  // accessible name blends the row label with the type badge, so match by
  // href instead - the URL is the stable seam.
  const previewLink = page.getByRole('link', { name: /Button/ }).first();
  await expect(previewLink).toBeVisible();
  await expect(previewLink).toHaveAttribute('href', '/preview/button');

  await previewLink.click();
  await expect(page).toHaveURL(/\/preview\/button\/?$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Button' })
  ).toBeVisible();
});
