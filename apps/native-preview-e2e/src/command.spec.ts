import { expect, test } from '@playwright/test';

import { DRAWN, openDemo } from './test/preview';

test('the arrow keys move the highlight past a disabled item, and End and a further ArrowDown stop at the last', async ({
  page,
}) => {
  await openDemo(page, 'command-demo');
  const search = page.getByRole('combobox', { name: 'Type a command or search...' });
  const option = (name: string) => page.getByRole('option', { name });
  await search.click(DRAWN);
  await expect(option('Calendar')).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('ArrowDown');
  await expect(option('Search Emoji')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(option('Profile ⌘P')).toHaveAttribute('aria-selected', 'true');
  await expect(option('Calculator')).not.toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('End');
  await page.keyboard.press('ArrowDown');
  await expect(option('Settings ⌘S')).toHaveAttribute('aria-selected', 'true');
});
