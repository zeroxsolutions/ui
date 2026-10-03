import { expect, test } from '@playwright/test';

const ITEMS = ['Chat Message', 'Code Block', 'File Tree', 'Tag Input', 'Password Input', 'Status Indicator'];

// Mirrors the hero's own `homePageInstallCommand('status-indicator')`; the e2e project does not
// import the app's internals, so the URL is rebuilt here against the registry's published homepage.
const INSTALL_COMMAND = `pnpm dlx shadcn@latest add ${new URL('/r/status-indicator.json', 'https://ui.zeroxsolutions.com').href}`;

// WebKit and Firefox under Playwright do not grant clipboard-write permission the way Chromium does,
// so the real API is replaced with one that records what it was called with on `window`.
const STUB_CLIPBOARD = `(() => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: (text) => { window.__copiedText = text; return Promise.resolve(); } },
  });
})()`;

test('/ says what the registry is, shows its items live, fits a phone, and links on', async ({ page, browserName }) => {
  await page.addInitScript(STUB_CLIPBOARD);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  // Measured once the page's own requests settle, so a demo widened by a late image or font counts.
  // eslint-disable-next-line playwright/no-networkidle
  await page.waitForLoadState('networkidle');
  await expect.poll(() => page.evaluate('document.scrollingElement.scrollWidth > window.innerWidth')).toBe(false);
  // A cell is `min-w-0`, so a demo too wide for a phone does not widen the page; it overflows its cell.
  await expect
    .poll(() =>
      page
        .locator('[data-slot=home-grid-cell]')
        // Named structurally, because this project's tsconfig carries no 'dom' lib.
        .evaluateAll((cells: { scrollWidth: number; clientWidth: number }[]) =>
          cells
            .filter((cell) => cell.scrollWidth > cell.clientWidth)
            .map((cell) => `${cell.scrollWidth} > ${cell.clientWidth}`),
        ),
    )
    .toEqual([]);

  await page.setViewportSize({ width: 1440, height: 900 });
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Composed React components for shadcn, on Base UI.');
  const copyButton = main.getByRole('button', { name: 'Copy code' }).first();
  await expect(copyButton).toBeVisible();
  // Retries the click itself, not just the read after it: clicked before React hydrates the button,
  // it is a plain DOM click with no handler attached, and the first attempt is sometimes that one.
  await expect
    .poll(
      async () => {
        await copyButton.click();
        return page.evaluate('window.__copiedText');
      },
      { timeout: 10_000 },
    )
    .toBe(INSTALL_COMMAND);
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
  const home = page.getByRole('banner').getByRole('link', { name: 'ZUI' });
  await expect(home).toBeVisible();
  await home.click();
  await expect(page).toHaveURL(/\/$/);

  const icon = await request.get('/icon.svg');
  expect(icon.ok()).toBe(true);
  const svg = await icon.text();
  expect(svg).toContain('prefers-color-scheme: dark');
  expect(svg.match(/<rect /g)).toHaveLength(6);

  const favicon = await request.get('/favicon.ico');
  expect(favicon.ok()).toBe(true);
  expect(favicon.headers()['content-type']).toMatch(/^image\/(x-icon|vnd\.microsoft\.icon)$/);
  const icoBytes = await favicon.body();
  expect([...icoBytes.subarray(0, 4)]).toEqual([0x00, 0x00, 0x01, 0x00]);
  expect(icoBytes[6]).toBe(32);

  const appleIcon = await request.get('/apple-icon.png');
  expect(appleIcon.ok()).toBe(true);
  expect(appleIcon.headers()['content-type']).toBe('image/png');
  const pngBytes = await appleIcon.body();
  expect(pngBytes.readUInt32BE(16)).toBe(180);
  expect(pngBytes.readUInt32BE(20)).toBe(180);
});

// Counts WebGL contexts and animation frames, records when the first WebGL context was asked for
// (`__startedAt`) and when the last frame was requested (`__lastFrameAt`), and, with `noWebgl`, makes
// WebGL unavailable.
const instrument = (noWebgl: boolean): string => `(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  window.__contexts = 0; window.__frames = 0; window.__startedAt = 0; window.__lastFrameAt = 0;
  HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
    if (String(kind).startsWith('webgl')) {
      if (window.__contexts === 0) window.__startedAt = performance.now();
      window.__contexts++;
      if (${noWebgl}) return null;
    }
    return original.call(this, kind, ...rest);
  };
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) => {
    window.__frames++; window.__lastFrameAt = performance.now();
    return raf(callback);
  };
})()`;

// Resolves on the page's next idle callback, or after 200ms where there is none (Safari), which is when
// the shader would have started.
const NEXT_IDLE = `new Promise((resolve) =>
  typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(() => resolve()) : setTimeout(resolve, 200))`;

test('the hero shader holds still under reduced motion or without WebGL, and otherwise settles', async ({
  browser,
}) => {
  const reduced = await browser.newContext({ reducedMotion: 'reduce' });
  try {
    const still = await reduced.newPage();
    await still.addInitScript(instrument(false));
    await still.goto('/');
    await expect(still.getByRole('heading', { level: 1 })).toBeVisible();
    // The shader would start on the first idle callback; the second gives its lazy chunk a turn to arrive.
    await still.evaluate(NEXT_IDLE);
    await still.evaluate(NEXT_IDLE);
    expect(await still.evaluate('window.__contexts')).toBe(0);
  } finally {
    await reduced.close();
  }

  const bare = await browser.newContext({ reducedMotion: 'no-preference' });
  try {
    const fallback = await bare.newPage();
    const errors: string[] = [];
    fallback.on('pageerror', (error) => errors.push(error.message));
    await fallback.addInitScript(instrument(true));
    await fallback.goto('/');
    // The shader starts once the page is idle; ten seconds covers a cold worker on a shared runner.
    await expect.poll(() => fallback.evaluate('window.__contexts'), { timeout: 10_000 }).toBeGreaterThan(0);
    await expect(fallback.getByRole('heading', { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await bare.close();
  }

  const moving = await browser.newContext({ reducedMotion: 'no-preference' });
  try {
    const page = await moving.newPage();
    await page.addInitScript(instrument(false));
    await page.goto('/');
    await expect.poll(() => page.evaluate('window.__contexts'), { timeout: 10_000 }).toBeGreaterThan(0);
    // Settled is no frame requested across half a second. Fifteen seconds covers the start's own wait
    // on a slow runner; the five-second bound is asserted on the page's own clock below.
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
    expect(await page.evaluate('window.__lastFrameAt - window.__startedAt')).toBeLessThan(5_000);
  } finally {
    await moving.close();
  }
});
