'use client';

import { useRememberedEngine } from '@zeroxsolutions/ui/site/hooks/use-remembered-choice';
import { type SiteNav, SiteNavProvider } from '@zeroxsolutions/ui/site/providers/site-nav-provider';
import { type ReactNode, useMemo } from 'react';

import {
  platformCounterpart,
  platformHome,
  platformLocation,
  platformNavItems,
  type PlatformPages,
  withNativeEngine,
} from '@/lib/platform-nav';

/**
 * Hands the site's header and footer this app's web and native paths. A web page's counterpart switches
 * into the engine the reader last read native pages under.
 */
function PlatformNavProvider({ pages, children }: { pages: PlatformPages; children: ReactNode }): ReactNode {
  const engine = useRememberedEngine();
  const nav = useMemo<SiteNav>(
    () => ({
      locate: (pathname) => {
        const location = platformLocation(pathname);
        return 'engine' in location && location.engine
          ? { platform: location.platform, engine: location.engine }
          : { platform: location.platform };
      },
      home: platformHome,
      items: platformNavItems,
      counterpart: (pathname) => platformCounterpart(platformLocation(pathname), pages, engine),
      withEngine: withNativeEngine,
    }),
    [pages, engine],
  );
  return <SiteNavProvider nav={nav}>{children}</SiteNavProvider>;
}

export { PlatformNavProvider };
