import { test, expect } from '@playwright/test';

/**
 * Real-browser coverage for the doc-page foundation (Decision 2 + the
 * complete-doc-page requirement). Drives `/preview/button` as the reference
 * instance and asserts every section renders: the Preview frame, the
 * `shadcn add` command, the Props table, the Composition tree, and the
 * dark-mode toggle that flips `.dark` on `<html>`.
 */
const BUTTON_VARIANTS = ['Default', 'Secondary', 'Outline', 'Destructive', 'Ghost'];

test.describe('Doc page (/preview/button)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/preview/button');
  });

  test('renders the title, description, and dark-mode toggle in the header', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: 'Button' })
    ).toBeVisible();
    await expect(page.getByText(/Button primitive/i).first()).toBeVisible();
    await expect(
      page.locator('[data-slot="dark-mode-toggle"]')
    ).toBeVisible();
  });

  test('renders every Button variant in the Preview tab', async ({ page }) => {
    const frame = page.locator('[data-slot="component-preview"]');
    await expect(frame).toBeVisible();

    for (const name of BUTTON_VARIANTS) {
      await expect(
        frame.getByRole('button', { name, exact: true })
      ).toBeVisible();
    }
  });

  test('renders the shadcn add command and import snippet in the Code tab', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Code' }).click();

    const codePanel = page.locator('[data-slot="doc-tab-code"]');
    await expect(codePanel).toBeVisible();
    await expect(codePanel).toContainText(
      'npx shadcn add https://registry.zeroxsolutions.com/r/button.json'
    );
    await expect(codePanel).toContainText(
      "import { Button } from '@zeroxsolutions/ui/components/ui/button';"
    );
  });

  test('renders the Props table with Button rows in the Props tab', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Props' }).click();

    const propsPanel = page.locator('[data-slot="doc-tab-props"]');
    await expect(propsPanel).toBeVisible();
    const table = propsPanel.locator('[data-slot="props-table"]');
    await expect(table).toBeVisible();
    // `exact` because `variant` and `size` appear as substrings of the
    // description text in other rows.
    await expect(
      table.getByRole('cell', { name: 'variant', exact: true })
    ).toBeVisible();
    await expect(
      table.getByRole('cell', { name: 'size', exact: true })
    ).toBeVisible();
  });

  test('renders the Composition tree for Button in the Composition tab', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Composition' }).click();

    const compositionPanel = page.locator('[data-slot="doc-tab-composition"]');
    await expect(compositionPanel).toBeVisible();
    const tree = compositionPanel.locator('[data-slot="composition-tree"]');
    await expect(tree).toBeVisible();
    // Button is a leaf - the root is rendered with its slot badge.
    await expect(tree.getByText('Button')).toBeVisible();
  });

  test('the dark-mode toggle flips the .dark class on <html>', async ({
    page,
  }) => {
    const toggle = page.locator('[data-slot="dark-mode-toggle"]');

    // Default is light - no `.dark` class on <html>.
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);

    await toggle.click();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);

    // Toggling again flips back to light.
    await toggle.click();
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  });
});
