import { expect, test } from './test/fixtures';

test('/view/ai-provider-picker renders the block alone', async ({ page }) => {
  await page.goto('/view/ai-provider-picker');

  await expect(page.getByText('Anthropic Claude')).toBeVisible();
  await expect(page.getByRole('banner')).toHaveCount(0);
});

test('every published block fits a phone-wide frame without scrolling sideways', async ({ page, request }) => {
  const response = await request.get('/r/registry.json');
  const registry = (await response.json()) as { items: { name: string; type: string }[] };
  const blocks = registry.items.filter((item) => item.type === 'registry:block');
  expect(blocks.length).toBeGreaterThan(0);
  // A docs page frames its block at the column's width; on a 390-wide phone that is narrower still.
  await page.setViewportSize({ width: 390, height: 844 });

  for (const { name } of blocks) {
    await page.goto(`/view/${name}`);
    // eslint-disable-next-line playwright/no-networkidle
    await page.waitForLoadState('networkidle');
    expect(
      await page.evaluate('document.scrollingElement.scrollWidth > window.innerWidth'),
      `${name} scrolls sideways`,
    ).toBe(false);
  }
});
