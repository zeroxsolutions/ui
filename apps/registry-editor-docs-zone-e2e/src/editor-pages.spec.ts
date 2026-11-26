import { editorItems as items } from './test/editor-items';
import { expect, test } from './test/fixtures';

/**
 * What WebKit logs when leaving a page cancels a link's RSC prefetch it started (`Fetch API cannot load
 * /docs/editor/...?_rsc=... due to access control checks.`): the navigation the loop makes, not the page.
 */
const ABORTED_PREFETCH = /\?_rsc=\S+ due to access control checks/;

/**
 * What WebKit reports when the next goto cancels a chunk the page was still loading after its load event. Chromium and
 * Firefox report nothing for it, so a chunk that fails on its own still fails the case there.
 */
const ABORTED_CHUNK = /^Failed to load chunk /;

test('every editor page renders its demo on the server, and throws nothing once it runs', async ({
  page,
  request,
  browser,
  browserName,
}) => {
  // Each page is prerendered, but every editor page across a cold worker outruns the default deadline.
  test.setTimeout(270_000);
  expect(items.length).toBeGreaterThan(0);
  // Scripts off, so what the page holds is what the server sent and no effect has filled anything.
  const served = await browser.newContext({ javaScriptEnabled: false });
  const unhydrated = await served.newPage();

  const errors: string[] = [];
  const navigationNoise = (message: string): boolean =>
    ABORTED_PREFETCH.test(message) || (browserName === 'webkit' && ABORTED_CHUNK.test(message));
  page.on('pageerror', (error) => {
    if (!navigationNoise(error.message)) errors.push(`${page.url()}: ${error.message}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && !navigationNoise(message.text())) errors.push(`${page.url()}: ${message.text()}`);
  });

  for (const { name, title, type } of items) {
    const path = `/docs/editor/${name}`;
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    await unhydrated.setContent(await response.text());

    // A library draws nothing, so its page has no preview and shows its install and usage steps instead.
    if (type === 'registry:lib') {
      await expect(unhydrated.getByRole('button', { name: 'View code' }), name).toHaveCount(0);
      await expect(unhydrated.getByRole('heading', { level: 2, name: 'Installation' }), name).toBeVisible();
      await expect(unhydrated.getByRole('heading', { level: 2, name: 'Usage' }), name).toBeVisible();
    } else {
      await expect(
        unhydrated.getByRole('button', { name: 'View code' }).first(),
        `${name} on the server`,
      ).toBeVisible();
    }

    // Waits for the load event, so the page's own scripts have run and thrown before the next goto.
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  }

  await served.close();
  expect(errors).toEqual([]);
});
