import { type Locator, type Page, expect, test } from '@playwright/test';

import { DRAWN, openDemo } from './test/preview';

/** Sends two of the demo's questions, each answered in full, so the thread is taller than its viewport. */
async function fillTheThread(page: Page): Promise<void> {
  await openDemo(page, 'message-scroller-demo');
  const send = page.getByRole('button', { name: 'Send' });
  for (let turn = 0; turn < 2; turn++) {
    await send.click(DRAWN);
    await expect(send).toBeDisabled();
    // The reply streams word by word, and Send takes the next question once the last word is in.
    await expect(send).toBeEnabled({ timeout: 15_000 });
  }
}

/** Sends the next question, whose reply streams in while the case moves the thread away from its end. */
async function askAgain(page: Page): Promise<void> {
  const send = page.getByRole('button', { name: 'Send' });
  await send.click();
  await expect(send).toBeDisabled();
}

/** Where `thread` is scrolled to, read once it has held still across two of the browser's frames. */
async function restingScroll(thread: Locator): Promise<number> {
  const read = (): Promise<number> =>
    thread.evaluate(
      (element) =>
        new Promise<number>((resolve) => {
          const before = element.scrollTop;
          requestAnimationFrame(() => requestAnimationFrame(() => resolve(before === element.scrollTop ? before : -1)));
        }),
    );
  let at = -1;
  await expect.poll(async () => (at = await read())).toBeGreaterThanOrEqual(0);
  return at;
}

/** Waits until the reply being streamed has its last word, which would have pulled a following thread down. */
async function replied(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: 'Send' })).toBeEnabled({ timeout: 15_000 });
}

test('the wheel over a streaming thread leaves it where the reader put it as the reply streams', async ({ page }) => {
  await fillTheThread(page);
  const thread = page.getByRole('region', { name: 'Messages' });
  await askAgain(page);

  await thread.hover();
  await page.mouse.wheel(0, -400);
  const left = await restingScroll(thread);
  await replied(page);

  expect(await restingScroll(thread)).toBe(left);
});

test('the scroll button takes the thread to its end and gives the focus to the thread', async ({ page }) => {
  await fillTheThread(page);
  const thread = page.getByRole('region', { name: 'Messages' });
  await thread.focus();
  await thread.press('Home');
  const scrollDown = page.getByRole('button', { name: 'Scroll to end' });

  await scrollDown.click();

  await expect(scrollDown).toBeHidden();
  await expect(thread).toBeFocused();
});
