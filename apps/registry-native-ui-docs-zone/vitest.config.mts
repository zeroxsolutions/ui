import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/registry-native-ui-docs-zone',
  plugins: [react()],
  resolve: {
    // Mirrors tsconfig.json's paths. Array form so the more specific `@/registry` wins over `@`: each
    // string `find` matches `find` or `find + '/'`, so both would match a `@/registry/...` import.
    alias: [
      { find: '@/registry', replacement: resolve(import.meta.dirname, '../../packages/ui/registry') },
      { find: '@', replacement: resolve(import.meta.dirname, 'src') },
    ],
  },
  test: {
    name: '@zeroxsolutions/registry-native-ui-docs-zone',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,app,pages,specs}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
