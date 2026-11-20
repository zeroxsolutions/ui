import { expect, test } from './test/fixtures';

/**
 * What WebKit logs when leaving a page cancels a link's RSC prefetch it started (`Fetch API cannot load
 * /?_rsc=... due to access control checks.`): the navigation the loop makes, not the page. A prefetch
 * can start after the network has settled, as a link scrolls into view, so waiting does not rule it out.
 * It reaches the page as a console error or, when the router's fetch rejects unhandled, as a page error.
 */
const ABORTED_PREFETCH = /\?_rsc=\S+ due to access control checks/;

test('every component page renders its preview, fits a phone without a stage scrolling sideways, and throws nothing', async ({
  page,
  request,
}) => {
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
  await page.setViewportSize({ width: 390, height: 844 });

  for (const { name, title } of components) {
    await page.goto(`/docs/components/base/${name}`);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.locator('[data-slot=component-preview-stage]').first()).toBeVisible();
    // Measured once the page's own requests settle: a demo widened by an image or a font that arrives
    // late would otherwise pass on the first sample, taken before it lands.
    // eslint-disable-next-line playwright/no-networkidle
    await page.waitForLoadState('networkidle');
    await expect
      .poll(() => page.evaluate('document.scrollingElement.scrollWidth > window.innerWidth'), { message: name })
      .toBe(false);
    // The page itself never scrolls sideways, because each preview stage scrolls its own demo; so a demo
    // too wide for a phone shows only as its stage scrolling. A stage's viewport is its direct child.
    await expect
      .poll(
        () =>
          page
            .locator('[data-slot=component-preview-stage] > [data-slot=scroll-area-viewport]')
            // Named structurally, because this project's tsconfig carries no 'dom' lib for the
            // callback's parameter to draw scrollWidth and clientWidth from by its DOM type.
            .evaluateAll((viewports: { scrollWidth: number; clientWidth: number }[]) =>
              viewports
                .filter((viewport) => viewport.scrollWidth > viewport.clientWidth)
                .map((viewport) => `${viewport.scrollWidth} > ${viewport.clientWidth}`),
            ),
        { message: `${name}: a preview stage scrolls sideways` },
      )
      .toEqual([]);
  }
  expect(errors).toEqual([]);
});
