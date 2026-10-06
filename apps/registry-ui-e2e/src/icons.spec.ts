import { expect, test } from './test/fixtures';

test('the icons page draws a mono brand mark as a mask in the text colour', async ({ page }) => {
  await page.goto('/docs/packages/icons');

  const mono = page.getByRole('img', { name: 'OpenAI', exact: true }).first();
  await expect(mono).toBeVisible();
  await expect(mono).toHaveCSS('mask-image', /\/brands\/mono\/openai\.svg/);
  const box = await mono.boundingBox();
  expect(box?.width).toBeGreaterThan(0);
  expect(box?.height).toBeGreaterThan(0);
  // The probe fetches in CORS mode as the mask does, so its load is the mask's CORS fetch succeeding.
  const probe = mono.getByTestId('brand-mark-probe');
  await expect.poll(() => probe.evaluate((img: { naturalWidth: number }) => img.naturalWidth)).toBeGreaterThan(0);
});
