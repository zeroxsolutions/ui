import { test, expect } from '@playwright/test';

/**
 * Real-browser coverage for the redesigned detail page (`/<kind>/<slug>`): a
 * top-nav header (no sidebar), a `Tabs` Preview/Code (the iframe loads the
 * standalone route; fullscreen is a target=_blank link), the Installation
 * command, and Usage. Parameterized over every catalog entry.
 */

const ENTRIES = [
  { path: '/components/split-button', title: 'SplitButton', item: 'split-button' },
  { path: '/components/menu-button', title: 'MenuButton', item: 'menu-button' },
  { path: '/components/field-group', title: 'FieldGroup', item: 'field-group' },
  { path: '/components/chat-message', title: 'ChatMessage', item: 'chat-message' },
  { path: '/components/tree', title: 'TreeItem', item: 'tree-item' },
  { path: '/blocks/ai-provider-picker', title: 'AiProviderPicker', item: 'ai-provider-picker' },
  { path: '/pages/demo-page', title: 'DemoPage', item: 'demo-page' },
] as const;

test.describe('Detail page (/components/split-button)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/split-button');
  });

  test('top-nav + Tabs + iframe + fullscreen link; no sidebar', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: 'SplitButton' }),
    ).toBeVisible();
    await expect(page.locator('[data-slot="site-header"]')).toBeVisible();
    await expect(page.locator('[data-slot="sidebar"]')).toHaveCount(0);

    const toggle = page.locator('[data-slot="preview-code-toggle"]');
    await expect(toggle).toBeVisible();
    await expect(
      toggle.locator('[data-slot="preview-code-trigger"]', { hasText: 'Preview' }),
    ).toHaveAttribute('aria-selected', 'true');

    // The Preview tab loads the standalone route in an iframe.
    await expect(page.locator('[data-slot="component-preview"] iframe')).toHaveAttribute(
      'src',
      /\/preview\/components\/split-button/,
    );
    // Fullscreen is a new-tab link to the standalone route (no Dialog).
    await expect(page.locator('[data-slot="preview-code-fullscreen"]')).toHaveAttribute(
      'target',
      '_blank',
    );
  });

  test('Installation command + Usage section', async ({ page }) => {
    const install = page.locator('[data-slot="installation"]');
    await expect(install).toContainText(
      'pnpm dlx shadcn add https://registry.zeroxsolutions.com/r/split-button.json',
    );
    await expect(page.locator('[data-slot="usage"]')).toBeVisible();
  });

  test('Code tab fetches the example source from the registry JSON', async ({ page }) => {
    await page
      .locator('[data-slot="preview-code-toggle"] [data-slot="preview-code-trigger"]', {
        hasText: 'Code',
      })
      .click();
    const code = page.locator('[data-slot="component-preview"][data-mode="code"]');
    await expect(code).toBeVisible();
    await expect(code).toContainText('SplitButton', { timeout: 10000 });
  });

  test('theme toggle flips the .dark class on <html>', async ({ page }) => {
    const toggle = page.locator('[data-slot="site-header"] [data-slot="dark-mode-toggle"]');
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
    await toggle.click();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  });
});

for (const entry of ENTRIES) {
  test(`detail page ${entry.path} renders its title + Installation`, async ({ page }) => {
    await page.goto(entry.path);
    await expect(
      page.getByRole('heading', { level: 1, name: entry.title }),
    ).toBeVisible();
    await expect(page.locator('[data-slot="installation"]')).toContainText(
      `/r/${entry.item}.json`,
    );
  });
}
