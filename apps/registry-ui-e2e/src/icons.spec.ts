import { expect, test } from '@playwright/test';

import { serveBrandArtwork } from './test/brand-artwork';

test.beforeEach(async ({ page }) => {
  await serveBrandArtwork(page);
});

test('the icons page draws a mono brand mark as a mask in the text colour', async ({ page }) => {
  await page.goto('/docs/packages/icons');

  const mono = page.getByRole('img', { name: 'OpenAI', exact: true }).first();
  await expect(mono).toBeVisible();
  await expect(mono).toHaveCSS('mask-image', /\/brands\/mono\/openai\.svg/);
  const box = await mono.boundingBox();
  expect(box?.width).toBeGreaterThan(0);
  expect(box?.height).toBeGreaterThan(0);
});
