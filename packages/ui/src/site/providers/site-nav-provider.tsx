'use client';

import { createContext, type ReactNode, useContext } from 'react';

import type { NativeEngine } from '../types/native-engine';
import type { Platform } from '../types/platform';
import type { SiteNavItem } from '../types/site-nav-item';

/**
 * What the site's header and footer need to know about the app's paths. They read it here because the
 * paths are the app's, and a server component cannot hand a client one a function as a prop.
 */
interface SiteNav {
  /** The platform `pathname` is on; on native, the engine its path names, absent where it names none or an unknown one. */
  locate(pathname: string): { platform: Platform; engine?: NativeEngine };
  /** Where `platform`'s home link points. */
  home(platform: Platform): string;
  /** The header's sections, each pointing into `platform`'s tree; on native, under `engine`. */
  items(platform: Platform, engine: NativeEngine): SiteNavItem[];
  /** The page at `pathname` on the other platform; where it has no such page, that platform's 404 lists the section. */
  counterpart(pathname: string): string;
  /** `href` moved onto `engine` where it is a native component or blocks page; any other link as it is. */
  withEngine(href: string, engine: NativeEngine): string;
}

const SiteNavContext = createContext<SiteNav | null>(null);

/** Hands `nav` to every `useSiteNav` call under `children`. */
function SiteNavProvider({ nav, children }: { nav: SiteNav; children: ReactNode }): ReactNode {
  return <SiteNavContext.Provider value={nav}>{children}</SiteNavContext.Provider>;
}

/** Returns the nearest `SiteNavProvider`'s nav; throws `useSiteNav needs a SiteNavProvider` outside one. */
function useSiteNav(): SiteNav {
  const nav = useContext(SiteNavContext);
  if (nav === null) {
    throw new Error('useSiteNav needs a SiteNavProvider');
  }
  return nav;
}

export { SiteNavProvider, useSiteNav };
export type { SiteNav };
