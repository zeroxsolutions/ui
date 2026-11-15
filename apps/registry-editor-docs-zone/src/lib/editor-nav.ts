import { DEFAULT_COMPONENT_BASE } from '@zeroxsolutions/ui/site/constants/component-bases';
import type { SiteNavItem } from '@zeroxsolutions/ui/site/types/site-nav-item';
import { editorDocsRoute } from '@zeroxsolutions/editor-docs-web/routes';

import { nativeDocsRoute } from '@/routes/native-paths';
import { webBlocksRoute, webComponentsRoute, webDocsRoute, webHomeRoute } from '@/routes/web-paths';

/** Whether `href` is a page of this zone: `/docs/editor` or a path under it, or a link within the page. */
export function inZone(href: string): boolean {
  const path = href.split(/[?#]/, 1)[0];
  return path === '' || path === editorDocsRoute.pathname || path.startsWith(`${editorDocsRoute.pathname}/`);
}

/** The native page an editor page switches to: the native docs' introduction, since no native editor is published. */
export function nativeCounterpart(): string {
  return nativeDocsRoute.build();
}

/** The registry's home page, which every link home points to. */
export function zoneHome(): string {
  return webHomeRoute.build();
}

/** The header's Docs, Components and Blocks, each pointing into the web tree; the editor pages sit under Docs. */
export function zoneNavItems(): SiteNavItem[] {
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
