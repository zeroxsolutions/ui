import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Consume `@chiselart/ui` from SOURCE (not dist) so component edits hot-reload
// and Tailwind v4 scans the library's classes from the module graph.
const uiSrc = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../packages/ui/src',
);

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
          // Order matters: the more specific subpath must win first.
          '@chiselart/ui/styles.css': resolve(uiSrc, 'styles.css'),
          '@chiselart/ui': resolve(uiSrc, 'index.ts'),
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
