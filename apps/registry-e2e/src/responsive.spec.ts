import { test, expect } from '@playwright/test';

/**
 * The responsive preview is an iframe sized to the device width. This proves the
 * mechanism: switching device changes the iframe's rendered width (mobile < 400,
 * tablet > 700). A width-constrained div would not give the component a real
 * viewport; the iframe does.
 */
test.describe('Responsive preview (iframe width)', () => {
  test('the device switcher resizes the iframe', async ({ page }) => {
    await page.goto('/components/split-button');
    const iframe = page.locator('[data-slot="component-preview"] iframe');

    await page
      .locator('[data-slot="preview-code-device-trigger"][data-device="mobile"]')
      .click();
    await expect.poll(async () => (await iframe.boundingBox())?.width).toBeLessThan(400);

    await page
      .locator('[data-slot="preview-code-device-trigger"][data-device="tablet"]')
      .click();
    await expect.poll(async () => (await iframe.boundingBox())?.width).toBeGreaterThan(700);
  });
});
