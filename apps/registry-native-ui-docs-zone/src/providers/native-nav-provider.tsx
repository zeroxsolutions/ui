'use client';

import { type SiteNav, SiteNavProvider } from '@zeroxsolutions/ui/site/providers/site-nav-provider';
import { nativeLocation, withNativeEngine } from '@zeroxsolutions/native-ui-docs-web/lib/native-location';
import type { ReactNode } from 'react';

import { webCounterpart, zoneHome, zoneNavItems } from '@/lib/native-nav';

const NATIVE_NAV: SiteNav = {
  // Every page this zone serves is a native one, the 404 included.
  locate: (pathname) => {
    const location = nativeLocation(pathname);
    return location && 'engine' in location && location.engine
      ? { platform: 'native', engine: location.engine }
      : { platform: 'native' };
  },
  home: zoneHome,
  items: zoneNavItems,
  counterpart: webCounterpart,
  withEngine: withNativeEngine,
};

/** Hands the site's header and footer this zone's paths, and the web pages registry-ui serves beside them. */
function NativeNavProvider({ children }: { children: ReactNode }): ReactNode {
  return <SiteNavProvider nav={NATIVE_NAV}>{children}</SiteNavProvider>;
}

export { NativeNavProvider };
