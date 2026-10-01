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

// Counts WebGL contexts and animation frames, and, with `noWebgl`, makes WebGL unavailable.
const instrument = (noWebgl: boolean): string => `(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  window.__contexts = 0; window.__frames = 0;
  HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
    if (String(kind).startsWith('webgl')) { window.__contexts++; if (${noWebgl}) return null; }
    return original.call(this, kind, ...rest);
  };
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) => { window.__frames++; return raf(callback); };
})()`;

test('the hero shader holds still under reduced motion or without WebGL, and otherwise settles', async ({
  browser,
}) => {
  const reduced = await browser.newContext({ reducedMotion: 'reduce' });
  const still = await reduced.newPage();
  await still.addInitScript(instrument(false));
  await still.goto('/');
  await expect(still.getByRole('heading', { level: 1 })).toBeVisible();
  await still.waitForTimeout(1_000);
  expect(await still.evaluate('window.__contexts')).toBe(0);
  await reduced.close();

  const bare = await browser.newContext({ reducedMotion: 'no-preference' });
  const fallback = await bare.newPage();
  const errors: string[] = [];
  fallback.on('pageerror', (error) => errors.push(error.message));
  await fallback.addInitScript(instrument(true));
  await fallback.goto('/');
  // The shader starts once the page is idle; ten seconds covers a cold worker on a shared runner.
  await expect.poll(() => fallback.evaluate('window.__contexts'), { timeout: 10_000 }).toBeGreaterThan(0);
  await expect(fallback.getByRole('heading', { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
  await bare.close();

  const moving = await browser.newContext({ reducedMotion: 'no-preference' });
  const page = await moving.newPage();
  await page.addInitScript(instrument(false));
  await page.goto('/');
  await expect.poll(() => page.evaluate('window.__contexts'), { timeout: 10_000 }).toBeGreaterThan(0);
  // Settled is no frame requested across half a second. The field settles within five seconds of
  // starting, and fifteen also covers the start's own wait on a slow runner.
  await expect
    .poll(
      async () => {
        const before = (await page.evaluate('window.__frames')) as number;
        // eslint-disable-next-line playwright/no-wait-for-timeout -- the window frames are counted over, not a wait for a state
        await page.waitForTimeout(500);
        return ((await page.evaluate('window.__frames')) as number) - before;
      },
      { timeout: 15_000 },
    )
    .toBe(0);
  await moving.close();
});
