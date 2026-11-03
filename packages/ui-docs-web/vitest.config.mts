import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/ui-docs-web',
  plugins: [react()],
  // The items in packages/ui import each other through the alias its `components.json` names.
  resolve: { alias: [{ find: '@/registry', replacement: resolve(import.meta.dirname, '../ui/registry') }] },
  test: {
    name: '@zeroxsolutions/ui-docs-web',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
