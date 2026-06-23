/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { cpSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/fluent-emoji',
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      tsconfigPath: resolve(import.meta.dirname, 'tsconfig.lib.json'),
    }),
    {
      // Ship the emoji artwork as RAW files. Vite library mode force-inlines any
      // asset routed through the bundler (import / `?url` / `new URL`) to a
      // base64 data URL — proven across eager, lazy, and `new URL` forms — so the
      // .webp must bypass the bundler entirely. Copy `assets/` → `dist/assets/`
      // verbatim (unhashed, keyed by codepoint) so `fluentEmojiUrl` can resolve
      // `<base>/<codepoint>.webp` and a consumer serves them as static files.
      name: 'chisel-copy-emoji-assets',
      closeBundle() {
        cpSync(
          resolve(import.meta.dirname, 'assets'),
          resolve(import.meta.dirname, 'dist/assets'),
          { recursive: true },
        );
      },
    },
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: 'src/index.ts',
      name: 'fluent-emoji',
      fileName: 'index',
      formats: ['es' as const],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
  test: {
    name: 'fluent-emoji',
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
