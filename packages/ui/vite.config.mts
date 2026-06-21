/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import { glob } from 'glob';
import { copyFileSync, readFileSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';

const pkg = JSON.parse(
  readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf8'),
);

// Externalize React, Base UI, and every declared dep (incl. deep imports like
// `@base-ui/react/scroll-area`, `lucide-react/icons`) so the consuming app
// dedupes a single instance — nothing third-party is inlined.
const external = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  ...Object.keys(pkg.peerDependencies ?? {}),
  ...Object.keys(pkg.dependencies ?? {}),
].map((name) => new RegExp(`^${name}(/.*)?$`));

// One entry per source file → real tree-shaking (a barrel would bundle the
// whole library on a single import). Path structure is preserved into dist/.
const entries = Object.fromEntries(
  glob
    .sync('src/**/*.{ts,tsx}', {
      cwd: import.meta.dirname,
      ignore: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.d.ts',
      ],
    })
    .map((file) => [
      relative('src', file.slice(0, file.length - extname(file).length)),
      resolve(import.meta.dirname, file),
    ]),
);

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/ui',
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    libInjectCss(),
    dts({
      entryRoot: 'src',
      tsconfigPath: resolve(import.meta.dirname, 'tsconfig.lib.json'),
    }),
    {
      // Ship the design-system theme/tokens as `@chiselart/ui/styles.css`.
      name: 'chisel-copy-styles',
      closeBundle() {
        copyFileSync(
          resolve(import.meta.dirname, 'src/styles.css'),
          resolve(import.meta.dirname, 'dist/styles.css'),
        );
      },
    },
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    copyPublicDir: false,
    reportCompressedSize: true,
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es' as const],
    },
    rollupOptions: {
      external,
      input: entries,
      output: {
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  test: {
    name: '@chiselart/ui',
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
