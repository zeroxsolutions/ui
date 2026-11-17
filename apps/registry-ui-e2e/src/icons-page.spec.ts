import { expect, test } from './test/fixtures';
import { waitForHydration } from './test/hydrated';

// The header lists its sections from the large width up; below it they sit in the menu.
test.use({ viewport: { width: 1280, height: 800 } });

test("the header's Icons entry opens the icons page, whose picked icon shows its install line", async ({ page }) => {
  await page.goto('/docs');
  await waitForHydration(page);

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Icons', exact: true }).click();

  await expect(page).toHaveURL('/icons/base');
  await expect(page.getByRole('heading', { level: 1, name: 'Icons' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'lucide' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search icons' }).fill('Arrow Up');
  const tile = page.getByRole('button', { name: 'arrow-up', exact: true });
  // The icon is its own chunk, loaded once its tile draws.
  await expect(tile.locator('svg')).toBeVisible();
  await expect(page.getByRole('button', { name: 'arrow-down', exact: true })).toHaveCount(0);
  await tile.click();
  await expect(page.getByRole('region', { name: 'arrow-up' })).toContainText(
    'pnpm dlx shadcn@latest add @zui/lucide-arrow-up-icon',
  );
});
