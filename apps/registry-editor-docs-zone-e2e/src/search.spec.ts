import { createSearchAPI } from 'fumadocs-core/search/server';

import { expect, test } from './test/fixtures';
import { waitForHydration } from './test/hydrated';

// registry-ui is not running here, so its index is a stand-in that holds one entry the editor index
// cannot: a heading no editor page has, and the query's word so the search finds it beside the editor's.
const sentinel = 'Zzquux sentinel heading about mermaid from the web index';

async function webIndex(): Promise<string> {
  const { staticGET } = createSearchAPI('advanced', {
    indexes: [
      {
        id: '/docs/zzquux',
        url: '/docs/zzquux',
        title: 'Zzquux',
        tag: 'web',
        structuredData: {
          headings: [{ id: 'sentinel', content: sentinel }],
          contents: [],
        },
      },
    ],
  });
  return (await staticGET()).text();
}

test("the search box asks the web zone's index and the editor zone's, and lists both", async ({ page }) => {
  test.setTimeout(90_000);
  const body = await webIndex();
  await page.route('**/api/search', (route) => {
    // Only the web zone's; the editor zone's lives under /docs/editor and answers for real.
    if (new URL(route.request().url()).pathname !== '/api/search') return route.fallback();
    return route.fulfill({ contentType: 'application/json', body });
  });
  const web = page.waitForRequest((request) => new URL(request.url()).pathname === '/api/search');
  const editor = page.waitForRequest((request) => new URL(request.url()).pathname === '/docs/editor/api/search');

  await page.goto('/docs/editor');
  await waitForHydration(page);
  await page.getByRole('button', { name: 'Search documentation' }).first().click();
  await page.getByPlaceholder('Search documentation...').fill('mermaid');
  await Promise.all([web, editor]);

  const results = page.getByRole('group', { name: 'Search results' }).getByRole('option');
  await expect(results.filter({ hasText: 'Zzquux sentinel heading' })).toHaveCount(1);
  // Anything else listed under the results is the editor index's.
  await expect(results.filter({ hasNotText: 'Zzquux' }).first()).toBeVisible();
});
