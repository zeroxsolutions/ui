import { DEFAULT_COMPONENT_BASE } from '@zeroxsolutions/ui/site/constants/component-bases';
import {
  blocksRoute,
  componentRoute,
  componentsRoute,
  docsPageRoute,
  docsRoute,
  homeRoute,
} from '@zeroxsolutions/ui-docs-web/routes';
import type { NativeEngine } from '@zeroxsolutions/ui/site/types/native-engine';
import type { SiteNavItem } from '@zeroxsolutions/ui/site/types/site-nav-item';

import {
  nativeBlocksRoute,
  nativeComponentRoute,
  nativeComponentsRoute,
  nativeDocsPageRoute,
  nativeDocsRoute,
  nativeHomeRoute,
} from '@/routes/native-paths';

/**
 * Where a pathname sits in the web tree. `slug` is a docs page's segments joined with `/`, `''` for the
 * introduction. `other` is every page outside home, the docs, components and blocks, such as a block's
 * own view.
 */
type WebLocation =
  | { section: 'home' }
  | { section: 'other' }
  | { section: 'docs'; slug: string }
  | { section: 'components'; base: string; name?: string }
  | { section: 'blocks'; base: string };

// A wildcard's matcher hands back its segments as an array, though the route's params type it as the joined string.
function slugOf(slug: string | string[]): string {
  return Array.isArray(slug) ? slug.join('/') : slug;
}

/** Reads which section and page of the web tree `pathname` is. */
function webLocation(pathname: string): WebLocation {
  if (homeRoute.matcher(pathname)) return { section: 'home' };
  const component = componentRoute.matcher(pathname);
  if (component) return { section: 'components', ...component.params };
  const components = componentsRoute.matcher(pathname);
  if (components) return { section: 'components', base: components.params.base };
  const blocks = blocksRoute.matcher(pathname);
  if (blocks) return { section: 'blocks', base: blocks.params.base };
  if (docsRoute.matcher(pathname)) return { section: 'docs', slug: '' };
  const docsPage = docsPageRoute.matcher(pathname);
  if (docsPage) return { section: 'docs', slug: slugOf(docsPage.params.slug) };

  return { section: 'other' };
}

/**
 * The native page at the same place as the web page at `pathname`, under `engine`: the home page, the
 * docs page with the same slug, the component with the same name, or the blocks page. This app does not
 * know which native pages exist, so a web page the native tree lacks leads to the native zone's 404,
 * which lists that section's pages.
 */
export function nativeCounterpart(pathname: string, engine: NativeEngine): string {
  const location = webLocation(pathname);
  switch (location.section) {
    case 'home':
      return nativeHomeRoute.build();
    case 'docs':
      return location.slug === '' ? nativeDocsRoute.build() : nativeDocsPageRoute.build({ slug: location.slug });
    case 'components':
      return location.name
        ? nativeComponentRoute.build({ engine, name: location.name })
        : nativeComponentsRoute.build({ engine });
    case 'blocks':
      return nativeBlocksRoute.build({ engine });
    case 'other':
      return nativeDocsRoute.build();
  }
}

/** The header's Docs, Components and Blocks, each pointing into the web tree. */
export function webNavItems(): SiteNavItem[] {
  const base = DEFAULT_COMPONENT_BASE;
  return [
    { href: docsRoute.build(), label: 'Docs', pattern: `${docsRoute.pathname}{/*rest}` },
    { href: componentsRoute.build({ base }), label: 'Components', pattern: `${componentsRoute.pathname}{/*rest}` },
    { href: blocksRoute.build({ base }), label: 'Blocks', pattern: blocksRoute.pathname },
  ];
}
