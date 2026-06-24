/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { glob } from 'glob';
import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const pkg = JSON.parse(
  readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf8'),
);

// Externalize React and every declared dep (incl. deep imports like
// `lucide-react/icons`) so the consuming app dedupes a single instance —
// nothing third-party is inlined.
const external = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  ...Object.keys(pkg.peerDependencies ?? {}),
  ...Object.keys(pkg.dependencies ?? {}),
].map((name) => new RegExp(`^${name}(/.*)?$`));

// One flat entry per source file, keyed by basename → `dist/<name>.js`, public
// as `@chiselart/icons/<name>`. Per-file entries give real tree-shaking (a brand
// mark's heavy inline SVG never lands in a bundle that only imports another).
// Basenames must be unique across src/ for the flat output to be collision-free.
const entries: Record<string, string> = {};
const seen: Record<string, string> = {};
for (const file of glob.sync('src/**/*.{ts,tsx}', {
  cwd: import.meta.dirname,
  ignore: [
    'src/index.ts',
    'src/**/*.{test,spec}.{ts,tsx}',
    'src/**/*.stories.{ts,tsx}',
    'src/**/*.d.ts',
  ],
})) {
  const name = basename(file).replace(/\.(ts|tsx)$/, '');
  if (seen[name]) {
    throw new Error(
      `Flat export name collision: "${name}" from ${file} and ${seen[name]}. ` +
        `Flat output requires unique basenames across src/.`,
    );
  }
  seen[name] = file;
  entries[name] = resolve(import.meta.dirname, file);
}

// In flat output every module is a sibling in dist/, so rewrite each relative
// import/export specifier to `./<basename>` — `./lib/lucide-mark` →
// `./lucide-mark`. Covers `from '…'` and inline `import('…')`.
const flattenSpecifiers = (content: string): string =>
  content
    .replace(
      /(from\s*['"])(\.[^'"]+)(['"])/g,
      (_m, pre, spec, post) => `${pre}./${spec.split('/').pop()}${post}`,
    )
    .replace(
      /(import\(\s*['"])(\.[^'"]+)(['"]\s*\))/g,
      (_m, pre, spec, post) => `${pre}./${spec.split('/').pop()}${post}`,
    );

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/icons',
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      tsconfigPath: resolve(import.meta.dirname, 'tsconfig.lib.json'),
      // Flatten the per-file declarations to `dist/<basename>.d.ts` and rewrite
      // their relative specifiers so the types mirror the flat `.js` layout.
      beforeWriteFile(filePath, content) {
        return {
          filePath: resolve(import.meta.dirname, 'dist', basename(filePath)),
          content: flattenSpecifiers(content),
        };
      },
    }),
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: entries,
      formats: ['es' as const],
    },
    rollupOptions: {
      external,
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  test: {
    name: '@chiselart/icons',
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
