import { expect, test } from './test/fixtures';

/**
 * What WebKit logs when leaving a page cancels a link's RSC prefetch it started (`Fetch API cannot load
 * /?_rsc=... due to access control checks.`): the navigation the loop makes, not the page.
 */
const ABORTED_PREFETCH = /\?_rsc=\S+ due to access control checks/;

test('every component page renders its heading and preview, and throws nothing', async ({ page, request }) => {
  // Each page is prerendered, but 60 of them across a cold worker outrun the default deadline.
  test.setTimeout(270_000);
  const response = await request.get('/r/styles/base-nova/registry.json');
  expect(response.status()).toBe(200);
  const registry = (await response.json()) as {
    items: { name: string; type: string; title: string; categories?: string[] }[];
  };
  // An editor item's page is the editor zone's, which its own e2e project visits.
  const components = registry.items.filter(
    (item) => item.type === 'registry:component' && item.categories?.[0] !== 'editor',
  );
  expect(components.length).toBeGreaterThan(0);

  const errors: string[] = [];
  page.on('pageerror', (error) => {
    if (!ABORTED_PREFETCH.test(error.message)) errors.push(`${page.url()}: ${error.message}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && !ABORTED_PREFETCH.test(message.text())) {
      errors.push(`${page.url()}: ${message.text()}`);
    }
  });

  for (const { name, title } of components) {
    // Waits for the load event, so a page's own scripts have run and thrown before the next goto.
    await page.goto(`/docs/components/base/${name}`);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View code' }).first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});
