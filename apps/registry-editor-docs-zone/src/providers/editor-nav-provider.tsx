'use client';

import { type SiteNav, SiteNavProvider } from '@zeroxsolutions/ui/site/providers/site-nav-provider';
import type { ReactNode } from 'react';

import { nativeCounterpart, zoneHome, zoneNavItems } from '@/lib/editor-nav';

const EDITOR_NAV: SiteNav = {
  // Every page this zone serves is a web one, the 404 included.
  locate: () => ({ platform: 'web' }),
  home: zoneHome,
  items: zoneNavItems,
  counterpart: nativeCounterpart,
  // Only a native page's links name an engine, and this zone serves none.
  withEngine: (href) => href,
};

/** Hands the site's header and footer the web paths registry-ui serves beside this zone, and the native docs. */
function EditorNavProvider({ children }: { children: ReactNode }): ReactNode {
  return <SiteNavProvider nav={EDITOR_NAV}>{children}</SiteNavProvider>;
}

export { EditorNavProvider };
