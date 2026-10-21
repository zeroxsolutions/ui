import { DEFAULT_COMPONENT_BASE } from '@/constants/component-bases';
import { NATIVE_ENGINES } from '@/constants/native-engines';
import {
  blocksRoute,
  componentRoute,
  componentsRoute,
  docsPageRoute,
  docsRoute,
  nativeBlocksRoute,
  nativeComponentRoute,
  nativeComponentsRoute,
  nativeDocsPageRoute,
  nativeDocsRoute,
} from '@/routes/app-routes';
import type { NativeEngine } from '@/types/native-engine';
import type { Platform } from '@/types/platform';
import type { SiteNavItem } from '@/types/site-nav-item';

/**
 * Where a pathname sits in the site's two trees. `slug` is a docs page's segments joined with `/`, `''`
 * for a tree's introduction. On native, `engine` is absent where the path's engine segment is outside
 * the known set, which is a 404. `other` is every web page outside the docs, components and blocks, such
 * as home.
 */
export type PlatformLocation =
  | { platform: 'web'; section: 'other' }
  | { platform: 'web'; section: 'docs'; slug: string }
  | { platform: 'web'; section: 'components'; base: string; name?: string }
  | { platform: 'web'; section: 'blocks'; base: string }
  | { platform: 'native'; section: 'docs'; slug: string }
  | { platform: 'native'; section: 'components'; engine?: NativeEngine; name?: string }
  | { platform: 'native'; section: 'blocks'; engine?: NativeEngine };

/** The pages each platform has, by docs slug (`''` for the introduction) and by component name, which the switch looks a counterpart up in. */
export interface PlatformPages {
  web: { docs: readonly string[]; components: readonly string[] };
  native: { docs: readonly string[]; components: readonly string[] };
}

function knownEngine(segment: string): NativeEngine | undefined {
  return NATIVE_ENGINES.find((engine) => engine === segment);
}

// A wildcard's matcher hands back its segments as an array, though the route's params type it as the joined string.
function slugOf(slug: string | string[]): string {
  return Array.isArray(slug) ? slug.join('/') : slug;
}

/** Reads which platform, section and page `pathname` is. */
export function platformLocation(pathname: string): PlatformLocation {
  const nativeComponent = nativeComponentRoute.matcher(pathname);
  if (nativeComponent) {
    const engine = knownEngine(nativeComponent.params.engine);
    const name = nativeComponent.params.name;
    return engine
      ? { platform: 'native', section: 'components', engine, name }
      : { platform: 'native', section: 'components', name };
  }
  const nativeComponents = nativeComponentsRoute.matcher(pathname);
  if (nativeComponents) {
    const engine = knownEngine(nativeComponents.params.engine);
    return engine
      ? { platform: 'native', section: 'components', engine }
      : { platform: 'native', section: 'components' };
  }
  const nativeBlocks = nativeBlocksRoute.matcher(pathname);
  if (nativeBlocks) {
    const engine = knownEngine(nativeBlocks.params.engine);
    return engine ? { platform: 'native', section: 'blocks', engine } : { platform: 'native', section: 'blocks' };
  }
  if (nativeDocsRoute.matcher(pathname)) return { platform: 'native', section: 'docs', slug: '' };
  const nativeDocsPage = nativeDocsPageRoute.matcher(pathname);
  if (nativeDocsPage) {
    return { platform: 'native', section: 'docs', slug: slugOf(nativeDocsPage.params.slug) };
  }

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
 * The same page on the other platform: the docs page with the same slug, the component with the same
 * name, or the blocks page. Where the other platform has no such page, its section index, so the switch
 * never lands on a 404. `engine` is the native engine a web page switches into.
 */
export function platformCounterpart(location: PlatformLocation, pages: PlatformPages, engine: NativeEngine): string {
  if (location.platform === 'web') {
    switch (location.section) {
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

/** The page at `location` under `engine`, for the engine switcher; `undefined` where the path holds no engine. */
export function withLocationEngine(location: PlatformLocation, engine: NativeEngine): string | undefined {
  if (location.platform !== 'native' || !('engine' in location) || !location.engine) return undefined;
  if (location.section === 'blocks') return nativeBlocksRoute.build({ engine });
  return location.name
    ? nativeComponentRoute.build({ engine, name: location.name })
    : nativeComponentsRoute.build({ engine });
}

/**
 * `href` with its native engine segment swapped for `engine`, keeping its query and fragment. A native
 * component page is one MDX file read under every engine, so its links name one engine and are moved to
 * the engine the page is read under. Any other link comes back as it is.
 */
export function withNativeEngine(href: string, engine: NativeEngine): string {
  const [, path = '', rest = ''] = /^([^?#]*)(.*)$/.exec(href) ?? [];
  const moved = path.startsWith('/') ? withLocationEngine(platformLocation(path), engine) : undefined;
  return moved ? `${moved}${rest}` : href;
}
