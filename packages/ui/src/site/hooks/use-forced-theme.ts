import { useSyncExternalStore } from 'react';

import { forcedThemeOf, THEME_PARAM, type PageTheme } from '../lib/view-params';

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * The theme the page's `?theme=` forces, for the theme provider's `forcedTheme`: `undefined` while the page
 * renders on the server and hydrates, as a statically rendered page was drawn with no query, and for a page
 * with no such param. It follows `forceTheme`.
 */
export function useForcedTheme(): PageTheme | undefined {
  return useSyncExternalStore(
    subscribe,
    () => forcedThemeOf(window.location.search),
    () => undefined,
  );
}

/**
 * Forces `theme` on the page by its `?theme=`, in place of the current entry, so the address keeps it and the
 * reader's stored theme stays as it was.
 */
export function forceTheme(theme: PageTheme): void {
  const url = new URL(window.location.href);
  url.searchParams.set(THEME_PARAM, theme);
  // Next's router keeps its own state in the entry, and reads an address set this way as its own.
  window.history.replaceState(window.history.state, '', url);
  for (const listener of listeners) listener();
}
