'use client';

import { type ComponentProps, type ComponentType, createContext, type ReactNode, useContext } from 'react';

/**
 * What the site components need from the app that renders them: a link element and the router. They
 * read it here because nothing in this package may import a framework's router.
 */
interface Host {
  /** Renders an anchor to `href`, client-side routed where the host can. */
  Link: ComponentType<ComponentProps<'a'> & { href: string }>;
  /** A hook: the current path, without the query string. */
  usePathname(): string;
  /** A hook: the current query string, read-only. */
  useSearchParams(): URLSearchParams;
  /** Navigates to `href`, adding a history entry. */
  push(href: string): void;
  /** Navigates to `href` in place of the current history entry. */
  replace(href: string): void;
}

const HostContext = createContext<Host | null>(null);

/** Hands `host` to every `useHost` call under `children`. */
function HostProvider({ host, children }: { host: Host; children: ReactNode }): ReactNode {
  return <HostContext.Provider value={host}>{children}</HostContext.Provider>;
}

/** Returns the nearest `HostProvider`'s host; throws `useHost needs a HostProvider` outside one. */
function useHost(): Host {
  const host = useContext(HostContext);
  if (host === null) {
    throw new Error('useHost needs a HostProvider');
  }
  return host;
}

export { HostProvider, useHost };
export type { Host };
