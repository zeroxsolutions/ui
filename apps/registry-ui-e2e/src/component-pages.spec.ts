import { expect, test } from '@playwright/test';

test('every component page renders its preview, fits a phone, and throws nothing', async ({ page, request }) => {
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
    await expect
      .poll(() => page.evaluate('document.scrollingElement.scrollWidth > window.innerWidth'), { message: name })
      .toBe(false);
    // WebKit reports a prefetch aborted by navigation as a page error, so let this page's own
    // header-link prefetches settle before leaving it for the next one.
    // eslint-disable-next-line playwright/no-networkidle
    await page.waitForLoadState('networkidle');
  }
  expect(errors).toEqual([]);
});
