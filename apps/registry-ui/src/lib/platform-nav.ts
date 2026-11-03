import { DEFAULT_COMPONENT_BASE } from '@zeroxsolutions/ui/site/constants/component-bases';
import {
  blocksRoute,
  componentRoute,
  componentsRoute,
  docsPageRoute,
  docsRoute,
  homeRoute,
} from '@zeroxsolutions/ui-docs-web/routes';
import { nativeLocation, type NativeLocation } from '@zeroxsolutions/native-ui-docs-web/lib/native-location';
import {
  nativeBlocksRoute,
  nativeComponentRoute,
  nativeComponentsRoute,
  nativeDocsPageRoute,
  nativeDocsRoute,
  nativeHomeRoute,
} from '@zeroxsolutions/native-ui-docs-web/routes';
import type { NativeEngine } from '@zeroxsolutions/ui/site/types/native-engine';
import type { Platform } from '@zeroxsolutions/ui/site/types/platform';
import type { SiteNavItem } from '@zeroxsolutions/ui/site/types/site-nav-item';

/**
 * Where a pathname sits in the site's two trees. `slug` is a docs page's segments joined with `/`, `''`
 * for a tree's introduction. `other` is every web page outside home, the docs, components and blocks,
 * such as a block's own view.
 */
export type PlatformLocation =
  | { platform: 'web'; section: 'home' }
  | { platform: 'web'; section: 'other' }
  | { platform: 'web'; section: 'docs'; slug: string }
  | { platform: 'web'; section: 'components'; base: string; name?: string }
  | { platform: 'web'; section: 'blocks'; base: string }
  | NativeLocation;

/** The pages each platform has, by docs slug (`''` for the introduction) and by component name, which the switch looks a counterpart up in. */
export interface PlatformPages {
  web: { docs: readonly string[]; components: readonly string[] };
  native: { docs: readonly string[]; components: readonly string[] };
}

// A wildcard's matcher hands back its segments as an array, though the route's params type it as the joined string.
function slugOf(slug: string | string[]): string {
  return Array.isArray(slug) ? slug.join('/') : slug;
}

/** Reads which platform, section and page `pathname` is. */
export function platformLocation(pathname: string): PlatformLocation {
  if (homeRoute.matcher(pathname)) return { platform: 'web', section: 'home' };
  const native = nativeLocation(pathname);
  if (native) return native;

  const component = componentRoute.matcher(pathname);
  if (component) return { platform: 'web', section: 'components', ...component.params };
  const components = componentsRoute.matcher(pathname);
  if (components) return { platform: 'web', section: 'components', base: components.params.base };
  const blocks = blocksRoute.matcher(pathname);
  if (blocks) return { platform: 'web', section: 'blocks', base: blocks.params.base };
  if (docsRoute.matcher(pathname)) return { platform: 'web', section: 'docs', slug: '' };
  const docsPage = docsPageRoute.matcher(pathname);
  if (docsPage) return { platform: 'web', section: 'docs', slug: slugOf(docsPage.params.slug) };

  return { platform: 'web', section: 'other' };
}

/**
 * The same page on the other platform: the home page, the docs page with the same slug, the component
 * with the same name, or the blocks page. Where the other platform has no such page, its section index, so the switch
 * never lands on a 404. `engine` is the native engine a web page switches into.
 */
export function platformCounterpart(location: PlatformLocation, pages: PlatformPages, engine: NativeEngine): string {
  if (location.platform === 'web') {
    switch (location.section) {
      case 'home':
        return nativeHomeRoute.build();
      case 'docs':
        if (location.slug === '' || !pages.native.docs.includes(location.slug)) return nativeDocsRoute.build();
        return nativeDocsPageRoute.build({ slug: location.slug });
      case 'components':
        return location.name && pages.native.components.includes(location.name)
          ? nativeComponentRoute.build({ engine, name: location.name })
          : nativeComponentsRoute.build({ engine });
      case 'blocks':
        return nativeBlocksRoute.build({ engine });
      default:
        return nativeDocsRoute.build();
    }
  }

  const base = DEFAULT_COMPONENT_BASE;
  switch (location.section) {
    case 'home':
      return homeRoute.build();
    case 'docs':
      if (location.slug === '' || !pages.web.docs.includes(location.slug)) return docsRoute.build();
      return docsPageRoute.build({ slug: location.slug });
    case 'components':
      return location.name && pages.web.components.includes(location.name)
        ? componentRoute.build({ base, name: location.name })
        : componentsRoute.build({ base });
    case 'blocks':
      return blocksRoute.build({ base });
  }
}

/** Where `platform`'s home link points: that platform's home page. */
export function platformHome(platform: Platform): string {
  return platform === 'native' ? nativeHomeRoute.build() : homeRoute.build();
}

/** The header's Docs, Components and Blocks, each pointing into `platform`'s tree; on native, under `engine`. */
export function platformNavItems(platform: Platform, engine: NativeEngine): SiteNavItem[] {
  if (platform === 'native') {
    return [
      { href: nativeDocsRoute.build(), label: 'Docs', pattern: `${nativeDocsRoute.pathname}{/*rest}` },
      {
        href: nativeComponentsRoute.build({ engine }),
        label: 'Components',
        pattern: `${nativeComponentsRoute.pathname}{/*rest}`,
      },
      { href: nativeBlocksRoute.build({ engine }), label: 'Blocks', pattern: nativeBlocksRoute.pathname },
    ];
  }
  const base = DEFAULT_COMPONENT_BASE;
  return [
    { href: docsRoute.build(), label: 'Docs', pattern: `${docsRoute.pathname}{/*rest}` },
    { href: componentsRoute.build({ base }), label: 'Components', pattern: `${componentsRoute.pathname}{/*rest}` },
    { href: blocksRoute.build({ base }), label: 'Blocks', pattern: blocksRoute.pathname },
  ];
}
