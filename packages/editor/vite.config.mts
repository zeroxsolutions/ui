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

// Externalize React, the design system, and every declared dependency — most
// importantly the engine (`@tiptap/*`, and ProseMirror via the `@tiptap/pm`
// bundle, incl. deep imports like `@tiptap/pm/state`). Nothing engine-related
// is inlined, so the consuming app dedupes a single ProseMirror instance and a
// third-party feature package never introduces a second one.
const external = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  ...Object.keys(pkg.peerDependencies ?? {}),
  ...Object.keys(pkg.dependencies ?? {}),
].map((name) => new RegExp(`^${name}(/.*)?$`));

// One entry per source file, keyed by its path relative to `src/`, so the dist
// layout mirrors src 1:1 (`src/document/react/editor.tsx` →
// `dist/document/react/editor.js`, public as
// `@zeroxsolutions/editor/document/react/editor`). Per-file entries give real
// tree-shaking and keep heavy features (mermaid/katex/table) code-split; the
// engine stays confined to `document/core/**` but is externalized regardless.
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
  cacheDir: '../../node_modules/.vite/packages/editor',
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
      // Ship raw CSS the build doesn't bundle: `styles.css` (the default editor
      // theme/tokens, built on `@zeroxsolutions/ui`) and `source.css` (Tailwind
      // `@source` registration so a consumer's Tailwind scans the package).
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
    {
      // Guard the engine-hiding invariant (see the `document-editor-core`
      // spec): no emitted declaration file may import an engine type, EXCEPT
      // the explicitly-unstable `advanced` escape. The public `.d.ts` surface
      // stays engine-free so a later engine swap does not ripple into consumers.
      name: 'assert-engine-free-dts',
      closeBundle() {
        // Matches an engine module in an import/export specifier of a `.d.ts`
        // (`from '@tiptap/…'`, `import("@tiptap/pm/state")`, `from
        // 'prosemirror-…'`) while ignoring the same names in prose comments.
        const engineImport =
          /(?:from|import\()\s*['"](?:@tiptap\/|prosemirror-)/;
        const offenders = glob
          .sync('dist/**/*.d.ts', {
            cwd: import.meta.dirname,
            ignore: ['dist/**/advanced*.d.ts', 'dist/**/advanced/**'],
          })
          .filter((file) =>
            engineImport.test(
              readFileSync(resolve(import.meta.dirname, file), 'utf8'),
            ),
          );
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
    name: '@zeroxsolutions/editor',
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
