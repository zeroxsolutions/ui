import { type Locator, type Page } from '@playwright/test';

import { expect, test } from './test/fixtures';
import { DRAWN, inside } from './test/native-preview';

/** Each demo the page draws, by its frame's name, and something the demo draws once it has loaded. */
const DEMOS: [string, (page: Page) => Locator][] = [
  ['Button demo', (page) => inside(page, 'Button demo').getByRole('button', { name: 'Continue', exact: true })],
  ['Card demo', (page) => inside(page, 'Card demo').getByRole('button', { name: 'Pay', exact: true })],
  ['Input otp demo', (page) => inside(page, 'Input otp demo').getByLabel('Verification code')],
  ['Switch demo', (page) => inside(page, 'Switch demo').getByText('Wi-Fi', { exact: true })],
  ['Password input demo', (page) => inside(page, 'Password input demo').getByLabel('Password', { exact: true })],
  ['Tab bar demo', (page) => inside(page, 'Tab bar demo').getByText('Inbox', { exact: true })],
];

test.use({ colorScheme: 'light' });

test('/native says what the native registry is, draws its demos live, and links into the native tree', async ({
  page,
}) => {
  await page.goto('/native');

  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Composed React Native components for shadcn, on NativeWind or Uniwind.',
  );
  for (const [demo, drawn] of DEMOS) await expect(drawn(page), demo).toBeVisible(DRAWN);

  const firstStep = main
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { level: 3, name: '1. Add the @zui registry to components.json' }) });
  await expect(firstStep).toContainText('"style": "nativewind-vega"');
  await expect(firstStep).toContainText('"@zui": "https://ui.zeroxsolutions.com/r/styles/{style}/{name}.json"');

  await expect(page.getByRole('banner').getByRole('link', { name: 'ZUI' })).toHaveAttribute('href', '/native');
  await main.getByRole('link', { name: 'Browse components' }).click();
  await expect(page).toHaveURL('/native/components/nativewind');
});
