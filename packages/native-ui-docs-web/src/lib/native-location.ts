import { NATIVE_ENGINES } from '@zeroxsolutions/ui/site/constants/native-engines';
import type { NativeEngine } from '@zeroxsolutions/ui/site/types/native-engine';

import {
  nativeBlocksRoute,
  nativeComponentRoute,
  nativeComponentsRoute,
  nativeDocsPageRoute,
  nativeDocsRoute,
  nativeHomeRoute,
} from '../routes';

/**
 * Where a pathname sits in the native tree. `slug` is a docs page's segments joined with `/`, `''` for
 * the introduction. `engine` is absent where the path's engine segment is outside the known set, which
 * is a 404.
 */
export type NativeLocation =
  | { platform: 'native'; section: 'home' }
  | { platform: 'native'; section: 'docs'; slug: string }
  | { platform: 'native'; section: 'components'; engine?: NativeEngine; name?: string }
  | { platform: 'native'; section: 'blocks'; engine?: NativeEngine };

function knownEngine(segment: string): NativeEngine | undefined {
  return NATIVE_ENGINES.find((engine) => engine === segment);
}

// A wildcard's matcher hands back its segments as an array, though the route's params type it as the joined string.
function slugOf(slug: string | string[]): string {
  return Array.isArray(slug) ? slug.join('/') : slug;
}

/** Reads which native section and page `pathname` is; `undefined` for a path outside the native tree. */
export function nativeLocation(pathname: string): NativeLocation | undefined {
  if (nativeHomeRoute.matcher(pathname)) return { platform: 'native', section: 'home' };
  const component = nativeComponentRoute.matcher(pathname);
  if (component) {
    const engine = knownEngine(component.params.engine);
    const name = component.params.name;
    return engine
      ? { platform: 'native', section: 'components', engine, name }
      : { platform: 'native', section: 'components', name };
  }
  const components = nativeComponentsRoute.matcher(pathname);
  if (components) {
    const engine = knownEngine(components.params.engine);
    return engine
      ? { platform: 'native', section: 'components', engine }
      : { platform: 'native', section: 'components' };
  }
  const blocks = nativeBlocksRoute.matcher(pathname);
  if (blocks) {
    const engine = knownEngine(blocks.params.engine);
    return engine ? { platform: 'native', section: 'blocks', engine } : { platform: 'native', section: 'blocks' };
  }
  if (nativeDocsRoute.matcher(pathname)) return { platform: 'native', section: 'docs', slug: '' };
  const docsPage = nativeDocsPageRoute.matcher(pathname);
  if (docsPage) return { platform: 'native', section: 'docs', slug: slugOf(docsPage.params.slug) };
  return undefined;
}

/** The page at `location` under `engine`, for the engine switcher; `undefined` where the path holds no engine. */
export function withLocationEngine(location: NativeLocation, engine: NativeEngine): string | undefined {
  if (!('engine' in location) || !location.engine) return undefined;
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
  const location = path.startsWith('/') ? nativeLocation(path) : undefined;
  const moved = location && withLocationEngine(location, engine);
  return moved ? `${moved}${rest}` : href;
}
