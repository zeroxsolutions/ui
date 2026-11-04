import { type FrameLocator, type Locator, type Page } from '@playwright/test';

// The preview is an Expo web export, which loads its bundle and its fonts before it draws.
export const DRAWN = { timeout: 30_000 };

/** The frame drawing the demo a reader knows as `demo`, such as `Button demo`. */
export function frame(page: Page, demo: string): Locator {
  return page.getByTitle(`${demo} preview`, { exact: true });
}

/** What the frame drawing `demo` holds. */
export function inside(page: Page, demo: string): FrameLocator {
  return frame(page, demo).contentFrame();
}
