import { expectDocumentLoadsAcrossZones } from './test/cross-zone-links';
import { expect, test } from './test/fixtures';

/** Whether `pathname` is a page this app serves, `/docs/editor` and under it being the editor zone's. */
function isRegistryUiPage(pathname: string): boolean {
  return pathname !== '/docs/editor' && !pathname.startsWith('/docs/editor/');
}

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

test('links into the editor zone with plain anchors', async ({ page }) => {
  // Each editor link is a document load, and the components page lists every editor item.
  test.setTimeout(270_000);
  await page.goto('/docs');
  const editorLinks = page
    .getByRole('navigation', { name: 'Docs' })
    .getByRole('link')
    .and(page.locator('[href^="/docs/editor"]'));
  await expect(editorLinks.first()).toBeVisible();
  for (const link of await editorLinks.all()) {
    await expect(link).not.toHaveAttribute('target', '_blank');
  }

  for (const start of ['/docs', '/docs/components']) {
    await expectDocumentLoadsAcrossZones(page, start, isRegistryUiPage);
  }
});
