/// <reference types='vitest' />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { glob } from 'glob';
import { copyFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

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

// One entry per source file, keyed by its path relative to `src/`, so the dist
// layout mirrors src 1:1 (`src/components/ui/button.tsx` →
// `dist/components/ui/button.js`, public as
// `@zeroxsolutions/ui/components/ui/button`). Per-file entries give real
// tree-shaking; mirroring src keeps the emitted relative specifiers (.js and
// .d.ts) valid with no rewriting.
const entries = Object.fromEntries(
  glob
    .sync('src/**/*.{ts,tsx}', {
      cwd: import.meta.dirname,
      ignore: [
        'src/index.ts',
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.d.ts',
      ],
    })
    .map((file) => [
      file.replace(/^src\//, '').replace(/\.(ts|tsx)$/, ''),
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
      // Ship raw CSS the build doesn't bundle: `styles.css` (the standalone
      // theme/tokens) and `source.css` (Tailwind `@source` registration).
      name: 'copy-styles',
      closeBundle() {
        for (const file of ['styles.css', 'source.css']) {
          copyFileSync(
            resolve(import.meta.dirname, `src/${file}`),
            resolve(import.meta.dirname, `dist/${file}`),
          );
        }
      },
    },
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    copyPublicDir: false,
    reportCompressedSize: true,
    lib: {
      entry: entries,
      formats: ['es' as const],
    },
    rolldownOptions: {
      external,
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  test: {
    name: '@zeroxsolutions/ui',
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
