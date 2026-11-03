/**
 * The browser APIs jsdom lacks that the components under test call as they mount, added only where
 * jsdom has none, so a spec that stubs one itself still wins. next-themes reads `matchMedia`, here
 * matching nothing, which is a desktop in its light scheme.
 */
if (typeof window !== 'undefined') {
  window.matchMedia ??= (media: string) =>
    ({
      matches: false,
      media,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
