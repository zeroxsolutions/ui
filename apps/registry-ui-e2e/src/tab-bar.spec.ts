import { expect, test } from './test/fixtures';

test('the tab bar names every destination, shows only the active label, and moves the current page', async ({
  page,
}) => {
  await page.goto('/docs/components/base/tab-bar');
  const bar = page.getByRole('navigation', { name: 'Main' });
  const home = bar.getByRole('link', { name: 'Home' });
  const search = bar.getByRole('link', { name: 'Search' });

  await expect(home).toHaveAttribute('aria-current', 'page');
  await expect(bar.getByRole('link', { name: 'Inbox' })).toHaveAccessibleDescription('3 new');

  // labels="selected": a hidden label still names its link, but takes no room on screen.
  const searchLabel = search.getByText('Search');
  expect((await searchLabel.boundingBox())?.width ?? 0).toBeLessThanOrEqual(1);
  expect((await home.getByText('Home').boundingBox())?.width ?? 0).toBeGreaterThan(1);
  // An item whose label is hidden keeps a 48px target.
  expect((await search.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(48);

  // A click before hydration only follows the fragment, so each try clicks again.
  await expect(async () => {
    await search.click();
    await expect(search).toHaveAttribute('aria-current', 'page', { timeout: 1_000 });
  }).toPass();
  await expect(home).not.toHaveAttribute('aria-current');
  await expect.poll(async () => (await searchLabel.boundingBox())?.width ?? 0).toBeGreaterThan(1);
});

test('a tab bar with labels="none" still names every destination, with no label taking room', async ({ page }) => {
  await page.goto('/docs/components/base/tab-bar');
  const bar = page.getByRole('navigation', { name: 'Sections' });
  const links = bar.getByRole('link');

  await expect(links).toHaveCount(3);
  for (const name of ['Home', 'Search', 'Profile']) {
    const link = bar.getByRole('link', { name });
    await expect(link).toBeVisible();
    expect((await link.getByText(name).boundingBox())?.width ?? 0).toBeLessThanOrEqual(1);
  }
});
