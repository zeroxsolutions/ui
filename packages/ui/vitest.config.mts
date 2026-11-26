import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { msw } from 'msw/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/ui',
  // Serves msw's worker script, which a browser spec's `setupWorker` registers to answer the requests it fakes.
  plugins: [react(), msw({ mode: 'worker-only' })],
  // The browser specs load the registry's stylesheet, whose `@import 'tailwindcss'` only Tailwind compiles.
  css: { postcss: { plugins: [tailwindcss()] } },
  // The items import each other through the alias `components.json` names, which tsconfig.lib.json maps.
  resolve: { alias: [{ find: '@/registry', replacement: resolve(import.meta.dirname, 'registry') }] },
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
          // The pages share one clipboard, so a spec copying in one would read another's paste.
          fileParallelism: false,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              contextOptions: { reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] },
            }),
            instances: [{ browser: 'chromium' }],
            // Every registry part carries a `data-slot`, so `getByTestId('<slot>')` finds a part with no role,
            // text or label.
            locators: { testIdAttribute: 'data-slot' },
          },
        },
      },
    ],
  },
});
