import { expect, test } from '@playwright/test';

import { DRAWN, openDemo } from './test/preview';

test('a pointer resting on a trigger opens its item, moving to the next trigger opens that one, and leaving closes it', async ({
  page,
}) => {
  await openDemo(page, 'navigation-menu-demo');
  const introduction = page.getByRole('link', { name: /^Introduction/ });

  await page.getByRole('button', { name: 'Getting started' }).hover(DRAWN);
  await expect(introduction).toBeVisible();

  await page.getByRole('button', { name: 'Components' }).hover();
  await expect(page.getByRole('link', { name: /^Alert Dialog/ })).toBeVisible();
  await expect(introduction).toBeHidden();

  await page.mouse.move(5, 600);
  await expect(page.getByRole('link', { name: /^Alert Dialog/ })).toBeHidden();
});
