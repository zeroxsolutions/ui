import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { defineBrowserCommand, playwright, PlaywrightBrowserProvider } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

import { PLATFORM_STYLES } from './src/site/constants/platform-styles';
import { VISUAL_CLOCK, VISUAL_THEMES, VISUAL_VIEWPORT } from './test/visual-environment';

const root = import.meta.dirname;

// What a page under test reaches outside the test server is answered from here, so a capture never
// waits on, or changes with, a host this repository does not control.
const STAND_IN_IMAGE = readFileSync(join(root, 'test/visual-stand-in.svg'));
const STAND_IN_FONT = readFileSync(
  join(root, 'node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2'),
);

/**
 * Answers every request the page sends to a host other than the test server: an image with the stand-in
 * picture, a font with Geist, anything else (video, audio, JSON) with a 404, which a media element draws as
 * its empty state. Fixes the page's clock, so a demo that prints today's date prints the same one each run.
 */
const isolated = new WeakSet<object>();
const isolateFromNetwork = defineBrowserCommand<[]>(async (context) => {
  if (!(context.provider instanceof PlaywrightBrowserProvider)) throw new Error('the visual suite runs on Playwright');
  const page = context.provider.getPage(context.sessionId);
  // Each spec file's setup asks again on the page it shares with the files before it.
  if (isolated.has(page)) return;
  isolated.add(page);
  const testServer = new URL(page.url()).host;
  await page.context().route(
    (url) => url.protocol.startsWith('http') && url.host !== testServer,
    (route) => {
      const type = route.request().resourceType();
      if (type === 'image') return route.fulfill({ contentType: 'image/svg+xml', body: STAND_IN_IMAGE });
      if (type === 'font') return route.fulfill({ contentType: 'font/woff2', body: STAND_IN_FONT });
      return route.fulfill({ status: 404, body: '' });
    },
  );
  await page.clock.setFixedTime(VISUAL_CLOCK);
});

/**
 * The visual regression suite: each `*.visual.spec.tsx` captures what it renders in every style, theme and
 * width, and compares it with the reference under `visual-baselines/`. Apart from `vitest.config.mts`, whose
 * specs assert behaviour, so a run here fails only for how something looks.
 */
export default defineConfig({
  root,
  cacheDir: '../../node_modules/.vite/packages/ui-visual',
  plugins: [react()],
  // The stylesheets the docs serve import `tailwindcss`, which only Tailwind compiles.
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: { alias: [{ find: '@/registry', replacement: resolve(root, 'registry') }], dedupe: ['react', 'react-dom'] },
  // Every dependency the specs reach is bundled before the first browser opens. Found mid-run instead, the
  // optimizer reloads the sixteen pages, and a page still on the old bundle holds a second React.
  optimizeDeps: { entries: ['registry/**/*.visual.spec.tsx', 'src/**/*.visual.spec.tsx', 'test/visual-setup.ts'] },
  test: {
    name: '@zeroxsolutions/ui:visual',
    watch: false,
    globals: true,
    // A case opens an editor, acts on it and waits for a stable capture while fifteen other browsers do the same,
    // which outlasts the 15s default on a loaded runner.
    testTimeout: 60_000,
    // One page per browser instance at a time: the limit applies to each of the sixteen, not to the run, and at four
    // the sixty-four pages open at once outgrew the memory of a 6 GB container.
    maxWorkers: 1,
    include: ['registry/**/*.visual.spec.tsx', 'src/**/*.visual.spec.tsx'],
    // A failed comparison writes the reference, the capture and their diff under the workspace's
    // `test-output/visual`, the one directory CI uploads for every project's visual suite.
    attachmentsDir: '../../test-output/visual/ui',
    setupFiles: ['test/visual-setup.ts'],
    browser: {
      enabled: true,
      headless: true,
      viewport: VISUAL_VIEWPORT,
      // One browser per style and theme, each a project of its own, so the matrix's sixteen columns run side
      // by side; a spec reads its column with `inject`.
      instances: PLATFORM_STYLES.web.flatMap((style) =>
        VISUAL_THEMES.map((theme) => ({
          browser: 'chromium' as const,
          name: `${style}-${theme}`,
          provide: { visualStyle: style, visualTheme: theme },
          provider: playwright({
            contextOptions: {
              // The viewer's own preferences, which the items' styles and hooks answer: still, and in this theme.
              reducedMotion: 'reduce',
              colorScheme: theme,
              deviceScaleFactor: 1,
              viewport: VISUAL_VIEWPORT,
              locale: 'en-US',
              timezoneId: 'UTC',
            },
          }),
        })),
      ),
      // Sixteen browsers start at once, and the default 30s lets the last ones time out on a loaded machine.
      connectTimeout: 120_000,
      commands: { isolateFromNetwork },
      expect: {
        toMatchScreenshot: {
          comparatorName: 'pixelmatch',
          comparatorOptions: {
            // The reference and the capture come from one browser build on one machine image, so a pixel that
            // differs is a change. `threshold` is pixelmatch's colour tolerance, and a light theme's muted fill or
            // border hairline sits nearer the white page than its 0.1 default, so any tolerance lets one appear or
            // vanish unseen. `includeAA` counts the pixels pixelmatch reads as anti-aliasing, which it otherwise
            // skips, and a radius change moves only those. Any differing pixel fails, because a radius moved by one
            // step changes only a few dozen pixels at a corner, and a ratio over the whole capture would let that
            // through.
            threshold: 0,
            includeAA: true,
            allowedMismatchedPixels: 0,
          },
          screenshotOptions: { animations: 'disabled', caret: 'hide', scale: 'css' },
          // Linux references are committed and compared in CI; a run on another platform writes and compares
          // its own beside them, which `.gitignore` keeps out of the tree.
          resolveScreenshotPath: ({
            arg,
            ext,
            root: projectRoot,
            testFileDirectory,
            testFileName,
            browserName,
            platform,
          }) =>
            resolve(
              projectRoot,
              'visual-baselines',
              testFileDirectory,
              testFileName.replace(/\.tsx$/, ''),
              `${arg}-${browserName}-${platform}${ext}`,
            ),
        },
      },
    },
  },
});
