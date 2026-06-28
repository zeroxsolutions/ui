import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vite';

// The workspace packages (`@zeroxsolutions/ui`, `…/icons`, `…/fluent-emoji`) are
// consumed exactly as a downstream app would — resolved from node_modules via
// their published `exports`, with NO source aliases or path rewrites. This keeps
// the Storybook a faithful integration check of the packages as shipped (so a
// broken export / type / missing file surfaces here too).
const config: StorybookConfig = {
  stories: ['../src/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],
  // Serve the Fluent emoji artwork as static files at `/fluent-emoji` (the base
  // set in preview.ts) — the package ships raw .webp, not bundled assets.
  staticDirs: [
    { from: '../../../packages/fluent-emoji/assets', to: '/fluent-emoji' },
  ],
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
    }),
};

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

export default config;
