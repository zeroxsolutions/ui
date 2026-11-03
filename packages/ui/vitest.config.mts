import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/ui',
  plugins: [react()],
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
    // A spec named `*.browser.spec.tsx` runs in Chromium; every other spec runs in jsdom.
    projects: [
      {
        extends: true,
        test: {
          name: '@zeroxsolutions/ui',
          environment: 'jsdom',
          setupFiles: ['test/setup.ts'],
          include: ['registry/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['**/*.browser.spec.tsx', '**/node_modules/**'],
        },
      },
      {
        extends: true,
        test: {
          name: '@zeroxsolutions/ui:browser',
          setupFiles: ['test/browser-setup.ts'],
          include: ['registry/**/*.browser.spec.tsx'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({ contextOptions: { reducedMotion: 'reduce' } }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
