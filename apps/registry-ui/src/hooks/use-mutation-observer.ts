import { useEffect, type RefObject } from 'react';

const DEFAULT_OPTIONS: MutationObserverInit = {
  attributes: true,
  characterData: true,
  childList: true,
  subtree: true,
};

/** Calls `callback` with each batch of changes to the element `ref` holds, for as long as it is mounted. */
export function useMutationObserver(
  ref: RefObject<HTMLElement | null>,
  callback: MutationCallback,
  options: MutationObserverInit = DEFAULT_OPTIONS,
): void {
  useEffect(() => {
    if (!ref.current) return;
    const observer = new MutationObserver(callback);
    observer.observe(ref.current, options);
    return () => observer.disconnect();
  }, [ref, callback, options]);
}
