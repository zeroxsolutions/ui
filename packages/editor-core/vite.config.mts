/// <reference types='vitest' />
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { glob } from 'glob';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf8'));

// Externalize React and every declared dependency — most importantly the engine
// (`@tiptap/core`, `@tiptap/pm/*`). Nothing engine-related is inlined.
const external = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  ...Object.keys(pkg.peerDependencies ?? {}),
  ...Object.keys(pkg.dependencies ?? {}),
].map((name) => new RegExp(`^${name}(/.*)?$`));

// One entry per source file, keyed by its path relative to `src/`, so the dist
// layout mirrors src 1:1. Per-file entries give real tree-shaking.
const entries = Object.fromEntries(
  glob
    .sync('src/**/*.{ts,tsx}', {
      cwd: import.meta.dirname,
      ignore: ['src/**/*.{test,spec}.{ts,tsx}', 'src/**/*.stories.{ts,tsx}', 'src/**/*.d.ts', 'src/**/*.fixture.ts'],
    })
    .map((file) => [file.replace(/^src\//, '').replace(/\.(ts|tsx)$/, ''), resolve(import.meta.dirname, file)]),
);

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/editor',
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      tsconfigPath: resolve(import.meta.dirname, 'tsconfig.lib.json'),
    }),
    {
      // Guard the engine-hiding invariant: no emitted declaration file may
      // import an engine type, EXCEPT the explicitly-unstable `advanced`
      // escape. The public `.d.ts` surface stays engine-free.
      name: 'assert-engine-free-dts',
      closeBundle() {
        const engineImport = /(?:from|import\()\s*['"](?:@tiptap\/|prosemirror-)/;
        const offenders = glob
          .sync('dist/**/*.d.ts', {
            cwd: import.meta.dirname,
            ignore: ['dist/**/advanced*.d.ts', 'dist/**/advanced/**'],
          })
          .filter((file) => engineImport.test(readFileSync(resolve(import.meta.dirname, file), 'utf8')));
        if (offenders.length > 0) {
          throw new Error(
            `[assert-engine-free-dts] Engine types leaked into the public .d.ts surface ` +
              `(only the opt-in 'advanced' entry may expose them):\n` +
              offenders.map((file) => `  - ${file}`).join('\n'),
          );
        }
      },
    },
  ],
  build: {
    outDir: './dist',
    // `typecheck` emits this package's declarations into dist, where a dependent's typecheck reads them
    // while this build may be running: emptying dist first deletes them under that typecheck.
    emptyOutDir: false,
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
    watch: false,
    globals: true,
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
    // A spec named `*.browser.spec.ts(x)` runs in Chromium, where a key press or a paste is the browser's own.
    projects: [
      {
        extends: true,
        test: {
          name: '@zeroxsolutions/editor-core',
          environment: 'jsdom',
          include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          exclude: ['**/*.browser.spec.{ts,tsx}', '**/node_modules/**'],
        },
      },
      {
        extends: true,
        test: {
          name: '@zeroxsolutions/editor-core:browser',
          include: ['src/**/*.browser.spec.{ts,tsx}'],
          // Every page in the browser shares one clipboard, so two files copying at once paste each other's copy.
          fileParallelism: false,
          browser: {
            enabled: true,
            headless: true,
            // The clipboard grant is a reader's own browser setting, so a paste case can arrange what another app copied.
            provider: playwright({
              contextOptions: { reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] },
            }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
}));
