import { expect, test } from '@playwright/test';

test('/view/ai-provider-picker renders the block alone', async ({ page }) => {
  await page.goto('/view/ai-provider-picker');

  await expect(page.getByText('Anthropic Claude')).toBeVisible();
  await expect(page.getByRole('banner')).toHaveCount(0);
});
