import { type Locator, type Page, expect } from '@playwright/test';

/** The export loads its bundle and its fonts before it draws, which a cold worker can take long over. */
export const DRAWN = { timeout: 30_000 };

/**
 * Opens the preview on the demo named `demo`, such as `calendar-demo`, in Vega and the light scheme.
 * @param demo - the demo's name, as a link to the preview carries it
 */
export async function openDemo(page: Page, demo: string): Promise<void> {
  await page.goto(`/native-preview/index.html?style=vega&demo=${demo}&theme=light`);
}

/**
 * Presses Tab until `target` holds the focus, as a keyboard user reaches a control.
 * @param target - a control the page's tab order reaches
 */
export async function tabTo(page: Page, target: Locator): Promise<void> {
  await expect(async () => {
    await page.keyboard.press('Tab');
    await expect(target).toBeFocused({ timeout: 100 });
  }).toPass();
}

/**
 * The box `target` is laid out in.
 * @throws when `target` is not laid out, as a chart drawn with no size is
 */
export async function boxOf(target: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  const box = await target.boundingBox();
  if (box === null) throw new Error('The element is not laid out');
  return box;
}
