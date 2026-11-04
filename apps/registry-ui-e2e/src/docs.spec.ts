import { expect, test } from './test/fixtures';

test('/docs renders the introduction page', async ({ page }) => {
  await page.goto('/docs');

  await expect(page.getByRole('heading', { level: 1, name: 'Introduction' })).toBeVisible();
});

test("a docs page's title carries the site's suffix", async ({ page }) => {
  await page.goto('/docs');

  await expect(page).toHaveTitle('Introduction - ZUI');
});

test("a docs page's code block is highlighted, its tokens in more than one colour", async ({ page }) => {
  await page.goto('/docs/installation');

  const block = page.getByRole('main').getByRole('code').filter({ hasText: 'pnpm dlx shadcn@latest init' }).first();
  await expect
    .poll(async () => {
      const tokens = await block.locator('span[style]').all();
      return new Set(await Promise.all(tokens.map((token) => token.getAttribute('style')))).size;
    })
    .toBeGreaterThan(1);
});
