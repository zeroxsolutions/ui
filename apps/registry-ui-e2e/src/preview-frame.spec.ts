import { type FrameLocator, type Locator, type Page } from '@playwright/test';

import { expect, test } from './test/fixtures';
import { waitForHydration } from './test/hydrated';

const PAGE = '/docs/components/base/ai-provider-picker';
const VIEW = '/view/ai-provider-picker-demo';

/** Expects the picker's grid to lay its cards in `count` columns: one, then `sm:` two, then `lg:` three. */
async function expectColumns(grid: Locator, count: number): Promise<void> {
  // One track size per column, each a length with no space in it.
  await expect(grid).toHaveCSS('grid-template-columns', new RegExp(`^\\S+(?: \\S+){${count - 1}}$`));
}

function pickerIn(scope: Page | FrameLocator): Locator {
  return scope.locator('[data-slot=ai-provider-picker]');
}

for (const [device, width, columns] of [
  ['Tablet', 768, 2],
  ['Mobile', 375, 1],
] as const) {
  test(`${device} frames the demo at ${width}px, where its breakpoints lay it out as a ${width}px window does`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto(PAGE);
    await waitForHydration(page);
    // The page's own window is wide enough for the picker's three columns.
    await expectColumns(pickerIn(page).first(), 3);

    await page
      .getByRole('group', { name: 'Device' })
      .first()
      .getByRole('button', { name: device, exact: true })
      .click();

    const frame = page.getByTitle(new RegExp(`^ai-provider-picker-demo, ${device.toLowerCase()}, `));
    const picker = pickerIn(frame.contentFrame());
    await expect(picker).toBeVisible();
    await expectColumns(picker, columns);

    await page.setViewportSize({ width, height: 900 });
    await page.goto(VIEW);
    await expectColumns(pickerIn(page), columns);
  });
}
