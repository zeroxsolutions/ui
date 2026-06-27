/// <reference types='vitest' />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { glob } from 'glob';
import { copyFileSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
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

// One flat entry per source file, keyed by basename → `dist/<name>.js`, public
// as `@zeroxsolutions/ui/<name>`. Per-file entries give real tree-shaking (a barrel
// would bundle the whole library on a single import). Basenames must be unique
// across src/ for the flat output to be collision-free.
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
// import/export specifier to `./<basename>` — `../../lib/utils` → `./utils`,
// `./ui/button` → `./button`. Covers `from '…'` and inline `import('…')`.
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
      // Flatten the per-file declarations to `dist/<basename>.d.ts` and rewrite
      // their relative specifiers so the types mirror the flat `.js` layout.
      beforeWriteFile(filePath, content) {
        return {
          filePath: resolve(import.meta.dirname, 'dist', basename(filePath)),
          content: flattenSpecifiers(content),
        };
      },
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
