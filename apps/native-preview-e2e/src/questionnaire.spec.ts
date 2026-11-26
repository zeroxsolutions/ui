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

test("a choice's letter picks it", async ({ page }) => {
  await openDemo(page, 'questionnaire-demo');
  const question = page.getByRole('radiogroup', { name: 'What should the agent build next?' });
  await expect(question.getByRole('radio').first()).toBeVisible(DRAWN);
  await tabTo(page, question.getByRole('radio').first());

  await page.keyboard.press('b');

  await expect(question.getByRole('radio', { name: /^Approval checkpoints/ })).toBeChecked();
});

test('Ctrl+Enter on a closed choice goes on once, to the next question', async ({ page }) => {
  await openDemo(page, 'questionnaire-review-demo');
  const closed = page.getByRole('radio', { name: 'Ask me later' });
  await expect(closed).toBeVisible(DRAWN);
  await closed.focus();

  await page.keyboard.press('Control+Enter');

  await expect(page.getByRole('progressbar', { name: 'Questionnaire progress' })).toHaveText('Question 2 of 2');
  await expect(page.getByRole('textbox', { name: 'Notes' })).toBeVisible();
});

test('Shift+Enter in a note of several lines breaks the line rather than going on', async ({ page }) => {
  await openDemo(page, 'questionnaire-review-demo');
  await page.getByRole('button', { name: 'Next' }).click(DRAWN);
  const notes = page.getByRole('textbox', { name: 'Notes' });

  await notes.pressSequentially('Fast');
  await page.keyboard.press('Shift+Enter');
  await notes.pressSequentially('and calm');

  await expect(notes).toHaveValue('Fast\nand calm');
});
