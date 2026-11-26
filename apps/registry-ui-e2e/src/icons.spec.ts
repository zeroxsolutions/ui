import { expect, test } from './test/fixtures';

test('the icons page draws a mono brand mark, its artwork loaded', async ({ page }) => {
  await page.goto('/docs/packages/icons');

  const mono = page.getByRole('img', { name: 'OpenAI', exact: true }).first();
  await expect(mono).toBeVisible();
  // The probe fetches in CORS mode as the mask does, so its load is the mask's CORS fetch succeeding.
  const probe = mono.getByTestId('brand-mark-probe');
  await expect.poll(() => probe.evaluate((img: { naturalWidth: number }) => img.naturalWidth)).toBeGreaterThan(0);
});
