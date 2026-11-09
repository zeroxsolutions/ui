import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import { transformDirection, transformFont, transformIcons, transformMenu, transformStyle } from 'shadcn/utils';

/** The `components.json` the CLI's install transforms read, as `shadcn/utils` types it without exporting it. */
type Config = Parameters<typeof transformIcons>[0]['config'];

/**
 * What a consumer's `components.json` says that the install transforms read: lucide icons, the default
 * menu colour and accent, and no right-to-left flipping. The site's primitives are drawn as such a
 * consumer installs them.
 */
const SITE_CONFIG = {
  style: 'base-nova',
  rsc: true,
  tsx: true,
  rtl: false,
  iconLibrary: 'lucide',
  menuColor: 'default',
  menuAccent: 'subtle',
  tailwind: { config: '', css: '', baseColor: 'neutral', cssVariables: true, prefix: '' },
  aliases: { components: '@/components', utils: '@/lib/utils' },
  resolvedPaths: {
    cwd: '',
    tailwindConfig: '',
    tailwindCss: '',
    utils: '',
    components: '',
    lib: '',
    hooks: '',
    ui: '',
  },
} as unknown as Config;

/**
 * Upstream's base item `source`, named `filename`, as the site's primitive: its icon placeholders drawn
 * with lucide, its menu and font markers resolved as the CLI resolves them for `SITE_CONFIG`, and its
 * imports of the base's own files read from this registry's base. Its `cn-` slots are kept, so the
 * stylesheet of whichever style the page carries draws it.
 */
export async function sitePrimitive(filename: string, source: string): Promise<string> {
  const transformed = await transformStyle(source, {
    styleMap: {},
    transformers: [transformIcons, transformMenu, transformFont].map(
      (transformer) =>
        ({ sourceFile }) =>
          transformer({ filename, raw: source, config: SITE_CONFIG, sourceFile }),
    ),
  });
  return (await transformDirection(transformed, false)).replaceAll(
    '@/registry/bases/base/',
    '@/registry/bases/base-ui/',
  );
}

/** Where the site's primitives live, from the package root. */
export const PRIMITIVES = 'registry/bases/base-ui/ui';

/** Where shadcn-upstream keeps upstream's base items. */
const BASE_SOURCES = join(
  dirname(createRequire(import.meta.url).resolve('@zeroxsolutions/shadcn-upstream/snapshot/base-item-slots.json')),
  'bases/base/ui',
);

/**
 * Each site primitive that upstream's base has, by file name, with the text `sitePrimitive` makes of the
 * base item. A site file upstream's base lacks (the magicui ones) is not listed, and a base item the site
 * does not draw is not added.
 */
export async function expectedPrimitives(root: string): Promise<Map<string, string>> {
  const base = new Set(readdirSync(BASE_SOURCES));
  const expected = new Map<string, string>();
  for (const file of readdirSync(join(root, PRIMITIVES))) {
    if (!base.has(file)) continue;
    expected.set(file, await sitePrimitive(file, readFileSync(join(BASE_SOURCES, file), 'utf8')));
  }
  return expected;
}
