import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join, resolve } from 'node:path';

import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Consume `@chiselart/ui` from SOURCE (not dist) so component edits hot-reload
// and Tailwind v4 scans the library's classes from the module graph. The
// published package exposes flat per-component subpaths (`@chiselart/ui/button`);
// here each one is aliased to its source file (which still lives nested under
// `src/components/ui`, `src/lib`, …), keyed by basename to mirror the build.
const uiSrc = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../packages/ui/src',
);

const isSkipped = (p: string) =>
  p.endsWith('.d.ts') ||
  /\.(test|spec|stories)\.(ts|tsx)$/.test(p) ||
  p === 'index.ts';

const subpathAliases: Record<string, string> = {
  '@chiselart/ui/styles.css': resolve(uiSrc, 'styles.css'),
  '@chiselart/ui/source.css': resolve(uiSrc, 'source.css'),
};
for (const rel of readdirSync(uiSrc, { recursive: true }) as string[]) {
  if (!/\.(ts|tsx)$/.test(rel) || isSkipped(rel)) continue;
  const name = basename(rel).replace(/\.(ts|tsx)$/, '');
  subpathAliases[`@chiselart/ui/${name}`] = join(uiSrc, rel);
}

const config: StorybookConfig = {
  stories: ['../src/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],
  addons: [],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },

  viteFinal: async (cfg) =>
    mergeConfig(cfg, {
      // `@storybook/react-vite` does NOT add `@vitejs/plugin-react` itself, and
      // there is no project `vite.config` to supply it — so it lives here, and
      // ONLY here. (Having it in two places double-declares the Fast Refresh
      // runtime: "RefreshRuntime has already been declared".)
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          ...subpathAliases,
          // The library's internal `@/…` imports resolve into its own src.
          '@': uiSrc,
        },
      },
    }),
};

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

export default config;
