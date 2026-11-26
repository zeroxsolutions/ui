import { expect, test } from '@playwright/test';

import { DRAWN, openDemo, tabTo } from './test/preview';

test('Space picks the focused choice, the arrows move to the next and pick it, and Enter goes on', async ({ page }) => {
  await openDemo(page, 'questionnaire-demo');
  const choices = page.getByRole('radiogroup', { name: 'What should the agent build next?' }).getByRole('radio');
  await expect(choices.first()).toBeVisible(DRAWN);

  await tabTo(page, choices.first());
  await page.keyboard.press('Space');
  await expect(choices.first()).toBeChecked();

  await page.keyboard.press('ArrowDown');
  await expect(choices.nth(1)).toBeFocused();
  await expect(choices.nth(1)).toBeChecked();
  await expect(choices.first()).not.toBeChecked();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('progressbar', { name: 'Questionnaire progress' })).toHaveText('Question 2 of 3');
});
