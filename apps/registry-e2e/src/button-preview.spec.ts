import { test, expect, type Locator } from '@playwright/test';

/**
 * Interaction / a11y / layout coverage for the Button primitive, driven against
 * the registry app's isolated preview at `/preview/button`.
 *
 * This is the real-browser coverage that used to live in Storybook's
 * `test-storybook` interaction tests. The library (`@zeroxsolutions/ui`) is
 * jsdom-only now, and jsdom cannot measure focus order or geometry - so those
 * assertions belong here, against the live preview.
 */

const VARIANTS = ['Default', 'Secondary', 'Outline', 'Destructive', 'Ghost'];

/** The isolated preview frame the docs page renders the component into. */
function preview(page: import('@playwright/test').Page): Locator {
  return page.locator('[data-slot="component-preview"]');
}

test.describe('Button preview (/preview/button)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/preview/button');
  });

  test('renders every variant inside an isolated preview frame', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: 'Button' })
    ).toBeVisible();

    const frame = preview(page);
    await expect(frame).toBeVisible();

    // Each variant is rendered live, inside the isolated frame (not page chrome).
    for (const name of VARIANTS) {
      await expect(frame.getByRole('button', { name, exact: true })).toBeVisible();
    }
    await expect(frame.getByRole('button')).toHaveCount(VARIANTS.length);
  });

  test('each variant is an accessible, operable button', async ({ page }) => {
    const frame = preview(page);
    // Role + accessible name + enabled state is the a11y contract the removed
    // test-storybook a11y checks asserted.
    for (const name of VARIANTS) {
      await expect(frame.getByRole('button', { name, exact: true })).toBeEnabled();
    }
  });

  test('supports keyboard focus and Tab order and click', async ({ page }) => {
    const frame = preview(page);
    const first = frame.getByRole('button', { name: 'Default', exact: true });

    await first.focus();
    await expect(first).toBeFocused();

    // Tab advances focus to the next variant in source order.
    await page.keyboard.press('Tab');
    await expect(
      frame.getByRole('button', { name: 'Secondary', exact: true })
    ).toBeFocused();

    // The button is clickable without throwing and stays rendered.
    await first.click();
    await expect(first).toBeVisible();
  });

  test('lays the variants on a single aligned row (real geometry)', async ({
    page,
  }) => {
    const frame = preview(page);
    const firstBox = await frame
      .getByRole('button', { name: 'Default', exact: true })
      .boundingBox();
    const lastBox = await frame
      .getByRole('button', { name: 'Ghost', exact: true })
      .boundingBox();

    expect(firstBox).not.toBeNull();
    expect(lastBox).not.toBeNull();
    if (firstBox && lastBox) {
      // Same row (vertically aligned) and laid left-to-right - exactly the
      // layout jsdom cannot measure.
      expect(Math.abs(firstBox.y - lastBox.y)).toBeLessThan(4);
      expect(lastBox.x).toBeGreaterThan(firstBox.x);
    }
  });
});
