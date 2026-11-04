import { DEFAULT_COMPONENT_BASE } from '@zeroxsolutions/ui/site/constants/component-bases';
import type { NativeEngine } from '@zeroxsolutions/ui/site/types/native-engine';
import type { Platform } from '@zeroxsolutions/ui/site/types/platform';
import type { SiteNavItem } from '@zeroxsolutions/ui/site/types/site-nav-item';
import { nativeLocation } from '@zeroxsolutions/native-ui-docs-web/lib/native-location';
import {
  nativeBlocksRoute,
  nativeComponentsRoute,
  nativeDocsRoute,
  nativeHomeRoute,
} from '@zeroxsolutions/native-ui-docs-web/routes';

import {
  webBlocksRoute,
  webComponentRoute,
  webComponentsRoute,
  webDocsPageRoute,
  webDocsRoute,
  webHomeRoute,
} from '@/routes/web-paths';

/**
 * The web page at the same place as the native page at `pathname`: the home page, the docs page with the
 * same slug, the component with the same name, or the blocks page. This zone does not know which web
 * pages exist, so a native page the web lacks leads to a web 404 rather than to its section's index.
 */
export function webCounterpart(pathname: string): string {
  const location = nativeLocation(pathname);
  const base = DEFAULT_COMPONENT_BASE;
  switch (location?.section) {
    case 'home':
      return webHomeRoute.build();
    case 'docs':
      return location.slug === '' ? webDocsRoute.build() : webDocsPageRoute.build({ slug: location.slug });
    case 'components':
      return location.name
        ? webComponentRoute.build({ base, name: location.name })
        : webComponentsRoute.build({ base });
    case 'blocks':
      return webBlocksRoute.build({ base });
    default:
      return webDocsRoute.build();
  }
}

/** Where `platform`'s home link points. */
export function zoneHome(platform: Platform): string {
  return platform === 'native' ? nativeHomeRoute.build() : webHomeRoute.build();
}

/** The header's Docs, Components and Blocks, each pointing into `platform`'s tree; on native, under `engine`. */
export function zoneNavItems(platform: Platform, engine: NativeEngine): SiteNavItem[] {
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
    { href: webDocsRoute.build(), label: 'Docs', pattern: `${webDocsRoute.pathname}{/*rest}` },
    {
      href: webComponentsRoute.build({ base }),
      label: 'Components',
      pattern: `${webComponentsRoute.pathname}{/*rest}`,
    },
    { href: webBlocksRoute.build({ base }), label: 'Blocks', pattern: webBlocksRoute.pathname },
  ];
}
