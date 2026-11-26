import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/native-ui-docs-web',
  plugins: [react()],
  // The items in packages/ui import each other through the alias its `components.json` names.
  resolve: { alias: [{ find: '@/registry', replacement: resolve(import.meta.dirname, '../ui/registry') }] },
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
          name: '@zeroxsolutions/native-ui-docs-web',
          environment: 'jsdom',
          setupFiles: ['src/test/setup.ts'],
          include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          exclude: ['**/*.browser.spec.tsx', '**/node_modules/**'],
        },
      },
      {
        extends: true,
        // Serves a stand-in for the native preview's export at the path a frame loads it from.
        publicDir: 'src/test/public',
        test: {
          name: '@zeroxsolutions/native-ui-docs-web:browser',
          include: ['src/**/*.browser.spec.tsx'],
          browser: {
            enabled: true,
            headless: true,
            // A spec reads back what a copy button wrote, which Chromium allows a page only with these granted.
            provider: playwright({
              contextOptions: { reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] },
            }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
