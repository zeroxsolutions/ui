import { expect, test, type Locator, type Page } from '@playwright/test';

const PAGE = '/docs/components/status-indicator';

/** Whether two boxes share any area. */
function intersects(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** The part of a block's code a reader sees: its text's box cut to the scroller's viewport. */
async function visibleCodeBox(block: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  const viewport = await block.locator('[data-slot=code-block-viewport]').first().boundingBox();
  const code = await block.locator('[data-slot=highlighted-code]').first().boundingBox();
  if (!viewport || !code) throw new Error('the block has no code in a scroller');
  const x = Math.max(viewport.x, code.x);
  const y = Math.max(viewport.y, code.y);
  return {
    x,
    y,
    width: Math.min(viewport.x + viewport.width, code.x + code.width) - x,
    height: Math.min(viewport.y + viewport.height, code.y + code.height) - y,
  };
}

/**
 * The scroll box of an element, as far as this spec reads it; this project's types carry no DOM lib.
 * A cast, not a helper: an `evaluate` callback runs in the page and sees nothing from this module.
 */
interface Scroller {
  scrollWidth: number;
  clientWidth: number;
  scrollLeft: number;
  scrollTo(options: { left: number }): void;
}

async function pageScrollsSideways(page: Page): Promise<boolean> {
  return Boolean(await page.evaluate('document.scrollingElement.scrollWidth > window.innerWidth'));
}

test('a component page previews the item, shows its source, and pages on', async ({ page }) => {
  await page.goto(PAGE);

  const preview = page.locator('[data-slot=component-preview]').first();
  await expect(preview.getByText('Connecting')).toBeVisible();

  // The button listens only once the page has hydrated, so it is clicked until the source opens.
  const viewCode = preview.getByRole('button', { name: 'View code' });
  const source = preview.locator('[data-slot=component-preview-code]');
  await expect(async () => {
    if (await viewCode.isVisible()) await viewCode.click({ timeout: 1_000 });
    await expect(source).toContainText('function StatusIndicatorDemo', { timeout: 1_000 });
  }).toPass();
  // The whole source is numbered by line.
  await expect(source.locator('[data-slot=code-block-line-numbers]')).toBeVisible();

  // The Command tab is the install section's default: one pnpm command, headed by its language.
  await expect(page.getByRole('tab', { name: 'Command', selected: true })).toBeVisible();
  const install = page.getByRole('tabpanel').filter({ hasText: 'pnpm dlx shadcn@latest add' }).first();
  await expect(install.getByText('bash', { exact: true })).toBeVisible();
  await expect(install.getByRole('tab')).toHaveCount(0);

  // A usage fence is headed by its language. A code block and the preview card carry no role, so their slots name them.
  const usage = page.locator('[data-slot=code-block]').filter({ hasText: 'import { StatusIndicator }' }).first();
  await expect(usage.getByText('tsx', { exact: true })).toBeVisible();

  const next = page.getByRole('link', { name: 'Next page' });
  const href = await next.getAttribute('href');
  await next.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
});

for (const [width, height] of [
  [1440, 900],
  [390, 844],
] as const) {
  test(`at ${width} wide no copy button covers the code it copies`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto(PAGE);

    // The install command and a usage fence.
    const copyCode = page.getByRole('button', { name: 'Copy code' }).filter({ visible: true });
    const blocks = page.locator('[data-slot=code-block]').filter({ has: copyCode });
    const count = await blocks.count();
    expect(count).toBeGreaterThanOrEqual(2);
    for (let index = 0; index < count; index++) {
      const block = blocks.nth(index);
      const button = await block
        .getByRole('button', { name: 'Copy code' })
        .filter({ visible: true })
        .first()
        .boundingBox();
      expect(button).not.toBeNull();
      expect(intersects(button!, await visibleCodeBox(block))).toBe(false);
    }
  });
}

test('at 390 wide a long command scrolls inside its block, and the page does not scroll sideways', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/docs/installation');

  const block = page.locator('[data-slot=code-block]').filter({ hasText: 'status-indicator.json' }).first();
  const viewport = block.locator('[data-slot=code-block-viewport]').first();
  await expect(viewport).toBeVisible();

  const box = await block.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);

  const overflow = await viewport.evaluate((element) => {
    const box = element as unknown as Scroller;
    return box.scrollWidth - box.clientWidth;
  });
  expect(overflow).toBeGreaterThan(0);
  await viewport.evaluate((element) => (element as unknown as Scroller).scrollTo({ left: 100 }));
  await expect
    .poll(() => viewport.evaluate((element) => (element as unknown as Scroller).scrollLeft))
    .toBeGreaterThan(0);

  expect(await pageScrollsSideways(page)).toBe(false);
});
