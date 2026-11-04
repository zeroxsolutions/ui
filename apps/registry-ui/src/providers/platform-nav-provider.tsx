'use client';

import { useRememberedEngine } from '@zeroxsolutions/ui/site/hooks/use-remembered-choice';
import { type SiteNav, SiteNavProvider } from '@zeroxsolutions/ui/site/providers/site-nav-provider';
import { type ReactNode, useMemo } from 'react';

import { homeRoute } from '@zeroxsolutions/ui-docs-web/routes';

import { nativeCounterpart, webNavItems } from '@/lib/platform-nav';

/**
 * Hands the site's header and footer this app's web paths, and the native pages the native zone serves
 * beside them. A page's counterpart switches into the engine the reader last read native pages under.
 */
function PlatformNavProvider({ children }: { children: ReactNode }): ReactNode {
  const engine = useRememberedEngine();
  const nav = useMemo<SiteNav>(
    () => ({
      // Every page this app serves is a web one, the 404 included.
      locate: () => ({ platform: 'web' }),
      home: () => homeRoute.build(),
      items: webNavItems,
      counterpart: (pathname) => nativeCounterpart(pathname, engine),
      // Only a native page's links name an engine, and this app serves none.
      withEngine: (href) => href,
    }),
    [engine],
  );
  return <SiteNavProvider nav={nav}>{children}</SiteNavProvider>;
}

export { PlatformNavProvider };
