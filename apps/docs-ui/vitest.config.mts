/// <reference types='vitest' />
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/docs-ui',
  plugins: [react()],
  resolve: {
    // Mirror apps/docs-ui/tsconfig.json path mapping. Array form so the more
    // specific `@/registry` wins over `@` (both would otherwise match a
    // `@/registry/...` import, since each string `find` matches `find` or
    // `find + '/'`). `@base-ui/react` etc. start with `@b`, not `@/`, so they
    // fall through to node_modules untouched.
    alias: [
      { find: '@/registry', replacement: resolve(import.meta.dirname, 'registry') },
      { find: '@', replacement: resolve(import.meta.dirname, 'src') },
    ],
  },
  test: {
    name: '@zeroxsolutions/docs-ui',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: [
      'registry/**/*.{test,spec}.{ts,tsx}',
      'src/**/*.{test,spec}.{ts,tsx}',
    ],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
});
