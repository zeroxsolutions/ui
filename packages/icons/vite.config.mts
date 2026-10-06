/// <reference types='vitest' />
import react from '@vitejs/plugin-react';
import { glob } from 'glob';
import { cpSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf8'));

// Externalize React and every declared dep (incl. deep imports like
// `lucide-react/icons`) so the consuming app dedupes a single instance -
// nothing third-party is inlined.
const external = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  ...Object.keys(pkg.peerDependencies ?? {}),
  ...Object.keys(pkg.dependencies ?? {}),
].map((name) => new RegExp(`^${name}(/.*)?$`));

// One entry per source file, keyed by its `src`-relative path (minus extension)
// -> `dist/<category>/<name>.js`, public as
// `@zeroxsolutions/icons/<category>/<name>`. Per-file entries give real
// tree-shaking (a heavy inline SVG never lands in a bundle that only imports
// another). Path keys are inherently unique, so a category folder is a real
// subpath, not a discarded label.
const entries: Record<string, string> = {};
for (const file of glob.sync('src/**/*.{ts,tsx}', {
  cwd: import.meta.dirname,
  // src/lib/ holds what the public entries bundle; a file there is not a subpath.
  ignore: ['src/lib/**', 'src/index.ts', 'src/**/*.{test,spec}.{ts,tsx}', 'src/**/*.stories.{ts,tsx}', 'src/**/*.d.ts'],
})) {
  // `file` is posix, e.g. `src/material/react.tsx` -> key `material/react`.
  const name = file.replace(/^src\//, '').replace(/\.(ts|tsx)$/, '');
  entries[name] = resolve(import.meta.dirname, file);
}

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/icons',
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      tsconfigPath: resolve(import.meta.dirname, 'tsconfig.lib.json'),
      // Declarations mirror the `src/` tree under `dist/` (e.g.
      // `dist/brand-mark.d.ts`), matching the path-keyed `.js` output.
    }),
    {
      // The artwork ships as raw files: library mode would inline an imported .svg as a data URL.
      name: 'copy-brand-assets',
      closeBundle() {
        cpSync(resolve(import.meta.dirname, 'assets'), resolve(import.meta.dirname, 'dist/assets'), {
          recursive: true,
          force: true,
        });
      },
    },
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
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
    name: '@zeroxsolutions/icons',
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
