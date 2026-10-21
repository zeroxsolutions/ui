import { type Locator } from '@playwright/test';

import { expect, test } from './test/fixtures';

/** The slice of a DOM node the hit test reads; this project compiles without the DOM's types. */
interface Hittable {
  contains: (other: Hittable) => boolean;
  ownerDocument: { elementFromPoint: (x: number, y: number) => Hittable | null };
}

/**
 * The edges of `field`'s 3px focus ring that something else is painted over. A ring is a shadow and takes
 * no hits, so a point on it lands on the field's own ancestors unless another element covers it there.
 */
async function coveredRingEdges(field: Locator): Promise<string[]> {
  const box = await field.boundingBox();
  if (!box) throw new Error('the field has no box');
  const midX = box.x + box.width / 2;
  const midY = box.y + box.height / 2;
  const ring: Record<string, [number, number]> = {
    top: [midX, box.y - 1.5],
    bottom: [midX, box.y + box.height + 1.5],
    left: [box.x - 1.5, midY],
    right: [box.x + box.width + 1.5, midY],
  };
  const covered: string[] = [];
  for (const [edge, point] of Object.entries(ring)) {
    const hitElsewhere = await field.evaluate((element: Hittable, [x, y]) => {
      const hit = element.ownerDocument.elementFromPoint(x, y);
      return hit !== null && !hit.contains(element) && !element.contains(hit);
    }, point);
    if (hitElsewhere) covered.push(edge);
  }
  return covered;
}

test("nothing in the avatar picker's emoji pane covers the search field's focus ring", async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/docs/components/base/avatar-picker');
  const search = page.getByRole('searchbox', { name: 'Search emoji' });
  // The popover opens only once the page has hydrated, so the trigger is pressed until it does.
  await expect(async () => {
    await page.getByRole('button', { name: 'Edit avatar' }).first().click();
    await expect(search).toBeVisible({ timeout: 1_000 });
  }).toPass();

  // Reached from the keyboard, so the field draws its focus ring.
  await search.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(search).toBeFocused();

  expect(await coveredRingEdges(page.getByRole('group').filter({ has: search }))).toEqual([]);
});
