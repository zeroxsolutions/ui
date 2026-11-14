import { expect, test } from './test/fixtures';

test('/view serves no page for a component, which is not a block', async ({ page }) => {
  const response = await page.goto('/view/ai-provider-picker');

  expect(response?.status()).toBe(404);
});

test('every published block fits a phone-wide frame and scrolls only inside its scroll area', async ({
  page,
  request,
}) => {
  const response = await request.get('/r/styles/base-nova/registry.json');
  const registry = (await response.json()) as { items: { name: string; type: string }[] };
  const blocks = registry.items.filter((item) => item.type === 'registry:block');
  test.skip(blocks.length === 0, 'the registry publishes no block');
  // A docs page frames its block at the column's width; on a 390-wide phone that is narrower still.
  await page.setViewportSize({ width: 390, height: 844 });

  for (const { name } of blocks) {
    await page.goto(`/view/${name}`);
    // eslint-disable-next-line playwright/no-networkidle
    await page.waitForLoadState('networkidle');
    // The page's own scroll area is the first in the document; a block wider than the frame scrolls inside it.
    expect(
      await page.evaluate(
        "(viewport => viewport.scrollWidth > viewport.clientWidth)(document.querySelector('[data-slot=scroll-area-viewport]'))",
      ),
      `${name} scrolls sideways`,
    ).toBe(false);
    expect(
      await page.evaluate('document.scrollingElement.scrollHeight > window.innerHeight'),
      `${name} scrolls the document, which draws the browser's scrollbar`,
    ).toBe(false);
  }
});
