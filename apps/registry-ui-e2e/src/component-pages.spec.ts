import { expect, test } from './test/fixtures';

test('every component page renders its preview, fits a phone without a stage scrolling sideways, and throws nothing', async ({
  page,
  request,
}) => {
  // Each page is prerendered, but 42 of them across a cold worker outrun the default deadline.
  test.setTimeout(180_000);
  const response = await request.get('/r/registry.json');
  expect(response.status()).toBe(200);
  const registry = (await response.json()) as { items: { name: string; type: string; title: string }[] };
  const components = registry.items.filter((item) => item.type === 'registry:component');
  expect(components.length).toBeGreaterThan(0);

  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`${page.url()}: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${page.url()}: ${message.text()}`);
  });
  await page.setViewportSize({ width: 390, height: 844 });

  for (const { name, title } of components) {
    await page.goto(`/docs/components/${name}`);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.locator('[data-slot=component-preview-stage]').first()).toBeVisible();
    // Measured once the page's own requests settle: a demo widened by an image or a font that arrives
    // late would otherwise pass on the first sample, taken before it lands. WebKit also reports a
    // prefetch aborted by navigation as a page error, so this lets the page's own header-link
    // prefetches settle before leaving it for the next one.
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
