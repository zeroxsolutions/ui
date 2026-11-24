import { useSyncExternalStore } from 'react';

import { forcedThemeOf, type PageTheme } from '../lib/view-params';

function subscribe(): () => void {
  return () => undefined;
}

/**
 * The theme the page's `?theme=` forces, for the theme provider's `forcedTheme`: `undefined` while the page
 * renders on the server and hydrates, as a statically rendered page was drawn with no query, and for a page
 * with no such param.
 */
export function useForcedTheme(): PageTheme | undefined {
  return useSyncExternalStore(
    subscribe,
    () => forcedThemeOf(window.location.search),
    () => undefined,
  );
}
