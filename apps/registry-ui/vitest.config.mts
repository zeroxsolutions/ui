/// <reference types='vitest' />
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vite';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/registry-ui',
  plugins: [react()],
  // postcss.config.mjs names its plugin as a string, which Next resolves and Vite rejects.
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: {
    // Mirror apps/registry-ui/tsconfig.json path mapping. Array form so the more
    // specific `@/registry` wins over `@` (both would otherwise match a
    // `@/registry/...` import, since each string `find` matches `find` or
    // `find + '/'`). `@base-ui/react` etc. start with `@b`, not `@/`, so they
    // fall through to node_modules untouched.
    alias: [
      {
        find: '@/registry',
        replacement: resolve(import.meta.dirname, 'registry'),
      },
      { find: '@', replacement: resolve(import.meta.dirname, 'src') },
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
    // A spec named `*.browser.spec.tsx` runs in Chromium; every other spec still runs in jsdom.
    projects: [
      {
        extends: true,
        test: {
          name: '@zeroxsolutions/registry-ui',
          environment: 'jsdom',
          setupFiles: ['src/test/setup.tsx'],
          include: ['*.spec.ts', 'registry/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['**/*.browser.spec.tsx', '**/node_modules/**'],
        },
      },
      {
        extends: true,
        test: {
          name: '@zeroxsolutions/registry-ui:browser',
          setupFiles: ['src/test/browser-setup.ts'],
          include: ['registry/**/*.browser.spec.tsx', 'src/**/*.browser.spec.tsx'],
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
