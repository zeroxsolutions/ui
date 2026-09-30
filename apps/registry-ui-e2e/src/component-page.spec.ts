import { expect, test } from '@playwright/test';

test('a component page previews the item, shows its source, and pages on', async ({ page }) => {
  await page.goto('/docs/components/status-indicator');

  const preview = page.getByRole('tabpanel', { name: 'Preview' }).first();
  await expect(preview.getByText('Connecting')).toBeVisible();

  await page.getByRole('tab', { name: 'Code' }).first().click();
  await expect(page.getByRole('tabpanel', { name: 'Code' }).first()).toContainText('function StatusIndicatorDemo');

  await page.getByRole('link', { name: 'Next: Button' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();
});
