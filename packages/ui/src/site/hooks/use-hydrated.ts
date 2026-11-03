import { useSyncExternalStore } from 'react';

function subscribe(): () => void {
  return () => undefined;
}

/**
 * `false` while the page renders on the server and hydrates, `true` once it has hydrated, so a component
 * draws a value only the browser reads, such as the URL's query on a statically rendered page, after it.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
