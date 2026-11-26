import { globSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { msw } from 'msw/vite';
import { defineConfig } from 'vitest/config';

/** Input or reads that reach the browser's clipboard, directly or through `test/uploads.ts`'s `pasteImage`. */
const CLIPBOARD_USE = /userEvent\.(copy|cut|paste)\(|navigator\.clipboard|pasteImage\(/;

/**
 * The browser specs that use the clipboard, which every page of one browser shares, so a spec copying in one page
 * would read another's paste. A run leaves a directory named after a failed spec, so only files are read.
 */
const CLIPBOARD_SPECS = globSync('{registry,src}/**/*.browser.spec.tsx', {
  cwd: import.meta.dirname,
  withFileTypes: true,
})
  .filter((entry) => entry.isFile())
  .map((entry) => join(entry.parentPath, entry.name))
  .filter((path) => CLIPBOARD_USE.test(readFileSync(path, 'utf8')))
  .map((path) => path.slice(import.meta.dirname.length + 1));

/** The browser every browser spec runs in, as a reader who asked for reduced motion, with or without the clipboard. */
function browserOf(permissions: string[]) {
  return {
    enabled: true,
    headless: true,
    provider: playwright({ contextOptions: { reducedMotion: 'reduce' as const, permissions } }),
    instances: [{ browser: 'chromium' as const }],
    // Every registry part carries a `data-slot`, so `getByTestId('<slot>')` finds a part with no role, text or label.
    locators: { testIdAttribute: 'data-slot' },
  };
}

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/ui',
  // Serves msw's worker script, which a browser spec's `setupWorker` registers to answer the requests it fakes.
  plugins: [react(), msw({ mode: 'worker-only' })],
  // The browser specs load the registry's stylesheet, whose `@import 'tailwindcss'` only Tailwind compiles.
  css: { postcss: { plugins: [tailwindcss()] } },
  // The items import each other through the alias `components.json` names, which tsconfig.lib.json maps.
  resolve: { alias: [{ find: '@/registry', replacement: resolve(import.meta.dirname, 'registry') }] },
  // Bundled before the first browser spec loads: a dependency Vite finds mid-run is bundled again with a React of its
  // own, and the spec importing it fails reading a hook from a null React.
  optimizeDeps: {
    include: [
      'fumadocs-core/page-tree',
      'fumadocs-core/search/client',
      'fumadocs-core/search/client/orama-static',
      'fumadocs-core/search/server',
      'fumadocs-core/toc',
      'msw',
      'msw/browser',
    ],
  },
  test: {
    watch: false,
    globals: true,
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
    // A spec named `*.browser.spec.tsx` runs in Chromium; every other spec runs in jsdom. A `*.visual.spec.tsx`
    // is `vitest.visual.config.mts`'s.
    projects: [
      {
        extends: true,
        test: {
          name: '@zeroxsolutions/ui',
          environment: 'jsdom',
          setupFiles: ['test/setup.ts'],
          include: ['registry/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['**/*.browser.spec.tsx', '**/*.visual.spec.tsx', '**/node_modules/**'],
        },
      },
      {
        extends: true,
        test: {
          name: '@zeroxsolutions/ui:browser',
          setupFiles: ['test/browser-setup.ts'],
          include: ['registry/**/*.browser.spec.tsx', 'src/**/*.browser.spec.tsx'],
          exclude: [...CLIPBOARD_SPECS, '**/node_modules/**'],
          browser: browserOf([]),
        },
      },
      {
        extends: true,
        test: {
          name: '@zeroxsolutions/ui:browser-clipboard',
          setupFiles: ['test/browser-setup.ts'],
          include: CLIPBOARD_SPECS,
          // One spec at a time, as the pages share the clipboard.
          fileParallelism: false,
          browser: browserOf(['clipboard-read', 'clipboard-write']),
        },
      },
    ],
  },
});
