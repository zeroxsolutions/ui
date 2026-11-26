import { expectDocumentLoadsAcrossZones } from './test/cross-zone-links';
import { expect, test } from './test/fixtures';
import { hydrated } from './test/hydrated';

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

test("the components page's editor links load the editor zone as documents", async ({ page }) => {
  // Each editor link is a document load, and the page lists every editor item.
  test.setTimeout(270_000);
  await expectDocumentLoadsAcrossZones(page, '/docs/components', isRegistryUiPage);
});

test.describe('on a phone-width header', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the menu's Editor section links into the editor zone with plain anchors", async ({ page }) => {
    await page.goto('/docs');

    const menu = page.getByRole('button', { name: 'Menu', exact: true }).filter({ visible: true });
    await hydrated(menu);
    await menu.click();
    const links = page.getByRole('dialog').getByRole('link');
    await expect(links.first()).toBeVisible();
    const anchors = await links.evaluateAll((elements: { getAttribute(name: string): string | null }[]) =>
      elements.map((element) => ({ href: element.getAttribute('href') ?? '', target: element.getAttribute('target') })),
    );
    const editorTargets = anchors.filter(({ href }) => /^\/docs\/editor(\/|$)/.test(href)).map(({ target }) => target);
    expect(editorTargets.length).toBeGreaterThan(0);
    expect(editorTargets.filter((target) => target === '_blank')).toEqual([]);
  });
});
