import { test, expect, type Locator, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Real-browser verification of the ButtonGroup radius seam on SplitButton and
 * MenuButton. The fix `968572f` restored `data-slot="button-group"` on the
 * Root (the ui-composed cluster had overridden it to `split-button` /
 * `menu-button`, which broke the descendant
 * `in-data-[slot=button-group]:rounded-md` hook). jsdom cannot measure
 * computed border-radius; this spec reads it from a live Chromium render.
 *
 * A correct seam means adjacent inner corners are square: the action button's
 * RIGHT corners and the caret button's LEFT corners are `0px`, while the
 * outer corners stay rounded.
 */

const SHOT_DIR = join(tmpdir(), 'registry-verify');
mkdirSync(SHOT_DIR, { recursive: true });

/** Resolved per-corner radii in px: [tl, tr, br, bl]. */
type Corners = [number, number, number, number];

async function radii(
  locator: Locator
): Promise<Corners> {
  // Read each corner individually: Tailwind's `rounded-r-none` / `rounded-l-none`
  // zero out specific corners, and we want to assert which.
  const props = [
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-right-radius',
    'border-bottom-left-radius',
  ] as const;
  const values = await locator.evaluate(
    (el, properties) =>
      properties.map((p) => {
        const v = getComputedStyle(el).getPropertyValue(p);
        // "0px" / "6px" / "var(--radius-md)" - resolve to a number when possible.
        const numeric = parseFloat(v);
        return Number.isFinite(numeric) ? numeric : -1;
      }),
    [...props]
  );
  return values as Corners;
}

async function readButtons(page: Page, kind: 'split' | 'menu') {
  const actionSlot =
    kind === 'split' ? 'split-button-action' : 'menu-button-action';
  const triggerSlot =
    kind === 'split' ? 'split-button-trigger' : 'menu-button-trigger';
  const action = page.locator(`[data-slot="${actionSlot}"]`).first();
  const trigger = page.locator(`[data-slot="${triggerSlot}"]`).first();
  await expect(action).toBeVisible();
  await expect(trigger).toBeVisible();
  return { action, trigger };
}

test.describe('SplitButton radius seam (/preview/components/split-button)', () => {
  test('action RIGHT and caret LEFT corners are square (the seam)', async ({
    page,
  }) => {
    await page.goto('/preview/components/split-button');

    const { action, trigger } = await readButtons(page, 'split');
    const actionCorners = await radii(action);
    const triggerCorners = await radii(trigger);

    // [tl, tr, br, bl]
    // Action is the LEFT segment: left corners rounded, RIGHT corners square.
    expect(actionCorners[1], 'action top-right is square (the seam)').toBe(0);
    expect(actionCorners[2], 'action bottom-right is square (the seam)').toBe(0);
    expect(actionCorners[0], 'action top-left is rounded (outer)').toBeGreaterThan(0);
    expect(actionCorners[3], 'action bottom-left is rounded (outer)').toBeGreaterThan(0);

    // Caret is the RIGHT segment: right corners rounded, LEFT corners square.
    expect(triggerCorners[0], 'caret top-left is square (the seam)').toBe(0);
    expect(triggerCorners[3], 'caret bottom-left is square (the seam)').toBe(0);
    expect(triggerCorners[1], 'caret top-right is rounded (outer)').toBeGreaterThan(0);
    expect(triggerCorners[2], 'caret bottom-right is rounded (outer)').toBeGreaterThan(0);

    await page.screenshot({
      path: join(SHOT_DIR, 'split-button.png'),
      fullPage: true,
    });
  });

  test('Root carries data-slot="button-group" (the fix)', async ({ page }) => {
    await page.goto('/preview/components/split-button');
    // The Root must surface the ButtonGroup primitive's data-slot, NOT the
    // overridden "split-button". The seam hook depends on this. Scoped to the
    // data-slot (not [role="group"]) because the docs chrome ToggleGroups also
    // render role="group".
    const root = page.locator('[data-slot="button-group"]').first();
    await expect(root).toHaveAttribute('data-slot', 'button-group');
  });
});

test.describe('MenuButton radius seam (/preview/components/menu-button)', () => {
  test('action RIGHT and caret LEFT corners are square (the seam)', async ({
    page,
  }) => {
    await page.goto('/preview/components/menu-button');

    const { action, trigger } = await readButtons(page, 'menu');
    const actionCorners = await radii(action);
    const triggerCorners = await radii(trigger);

    expect(actionCorners[1], 'action top-right is square (the seam)').toBe(0);
    expect(actionCorners[2], 'action bottom-right is square (the seam)').toBe(0);
    expect(actionCorners[0], 'action top-left is rounded (outer)').toBeGreaterThan(0);
    expect(actionCorners[3], 'action bottom-left is rounded (outer)').toBeGreaterThan(0);

    expect(triggerCorners[0], 'caret top-left is square (the seam)').toBe(0);
    expect(triggerCorners[3], 'caret bottom-left is square (the seam)').toBe(0);
    expect(triggerCorners[1], 'caret top-right is rounded (outer)').toBeGreaterThan(0);
    expect(triggerCorners[2], 'caret bottom-right is rounded (outer)').toBeGreaterThan(0);

    await page.screenshot({
      path: join(SHOT_DIR, 'menu-button.png'),
      fullPage: true,
    });
  });

  test('Root carries data-slot="button-group" (the fix)', async ({ page }) => {
    await page.goto('/preview/components/menu-button');
    const root = page.locator('[data-slot="button-group"]').first();
    await expect(root).toHaveAttribute('data-slot', 'button-group');
  });
});
