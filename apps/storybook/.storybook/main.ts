import { readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vite';

// Consume `@zeroxsolutions/ui` from SOURCE (not dist) so component edits hot-reload
// and Tailwind v4 scans the library's classes from the module graph. The
// published package exposes flat per-component subpaths (`@zeroxsolutions/ui/button`);
// here each one is aliased to its source file (which still lives nested under
// `src/components/ui`, `src/lib`, …), keyed by basename to mirror the build.
const uiSrc = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../packages/ui/src',
);

// `@zeroxsolutions/fluent-emoji` (catalog + self-hosted Fluent artwork) is consumed
// from source too, so its `import.meta.glob` over the bundled .webp runs in this
// build and emits the assets — no third-party CDN, no prebuilt dist needed.
const fluentEmojiSrc = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../packages/fluent-emoji/src/index.ts',
);

const isSkipped = (p: string) =>
  p.endsWith('.d.ts') ||
  /\.(test|spec|stories)\.(ts|tsx)$/.test(p) ||
  p === 'index.ts';

const subpathAliases: Record<string, string> = {
  '@zeroxsolutions/ui/styles.css': resolve(uiSrc, 'styles.css'),
  '@zeroxsolutions/ui/source.css': resolve(uiSrc, 'source.css'),
};
for (const rel of readdirSync(uiSrc, { recursive: true }) as string[]) {
  if (!/\.(ts|tsx)$/.test(rel) || isSkipped(rel)) continue;
  const name = basename(rel).replace(/\.(ts|tsx)$/, '');
  subpathAliases[`@zeroxsolutions/ui/${name}`] = join(uiSrc, rel);
}

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
      resolve: {
        alias: {
          ...subpathAliases,
          '@zeroxsolutions/fluent-emoji': fluentEmojiSrc,
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
