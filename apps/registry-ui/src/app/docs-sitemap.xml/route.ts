import { COMPONENT_BASES } from '@zeroxsolutions/ui/site/constants/component-bases';
import { publishedIconBases } from '@zeroxsolutions/ui-docs-web/lib/published-items';
import { blocksRoute, homeRoute, iconsRoute } from '@zeroxsolutions/ui-docs-web/routes';

import { registryHomepage } from '@/lib/registry';
import { sitemapResponse } from '@/lib/sitemap-xml';
import { source } from '@/lib/source';

// Unset, the handler runs on every request; `false` runs it once at build and the worker serves the file.
export const revalidate = false;

/** Every web page a reader lands on, at the registry's host: the home page, the blocks page of each base, the icons page of each base with icons, and every docs page. */
export function GET(): Response {
  return sitemapResponse(
    [
      homeRoute.build(),
      ...COMPONENT_BASES.map((base) => blocksRoute.build({ base })),
      ...publishedIconBases.map((base) => iconsRoute.build({ base })),
      ...source.getPages().map((page) => page.url),
    ].map((path) => new URL(path, registryHomepage).href),
  );
}
