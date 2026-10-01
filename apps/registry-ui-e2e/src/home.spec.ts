import { expect, test } from '@playwright/test';

const ITEMS = ['Chat Message', 'Code Block', 'File Tree', 'Tag Input', 'Password Input', 'Status Indicator'];

test('/ says what the registry is, shows its items live, fits a phone, and links on', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect.poll(() => page.evaluate('document.scrollingElement.scrollWidth > window.innerWidth')).toBe(false);

  await page.setViewportSize({ width: 1440, height: 900 });
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Composed React components for shadcn, on Base UI.');
  await expect(main.getByRole('button', { name: 'Copy code' }).first()).toBeVisible();
  for (const item of ITEMS) await expect(main.getByText(item, { exact: true })).toBeVisible();
  await expect(main.getByTitle('AI Provider Picker')).toBeVisible();

  const browse = main.getByRole('link', { name: 'Browse components' });
  const getStarted = main.getByRole('link', { name: 'Get started' });
  await browse.focus();
  // WebKit's default Tab sequence skips plain links (matching real Safari with "Full Keyboard
  // Access" off); Option+Tab is Safari's own key for moving to the next link.
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(getStarted).toBeFocused();

  await browse.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Components' })).toBeVisible();
});

test('the site carries its logo: the header link home, and the icons', async ({ page, request }) => {
  await page.goto('/docs');
  const home = page.getByRole('banner').getByRole('link', { name: 'ZeroXSolutions UI' });
  await expect(home).toBeVisible();
  await home.click();
  await expect(page).toHaveURL(/\/$/);

  const icon = await request.get('/icon.svg');
  expect(icon.ok()).toBe(true);
  const svg = await icon.text();
  expect(svg).toContain('prefers-color-scheme: dark');
  expect(svg.match(/<rect /g)).toHaveLength(6);
  expect((await request.get('/favicon.ico')).ok()).toBe(true);
  expect((await request.get('/apple-icon.png')).ok()).toBe(true);
});
