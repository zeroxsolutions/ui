/**
 * The browser APIs jsdom lacks that the components under test call as they mount, added only where
 * jsdom has none, so a spec that stubs one itself still wins. Base UI's scroll area, popups and
 * toggle groups measure with `ResizeObserver` and wait on `getAnimations`; cmdk scrolls the selected
 * item with `scrollIntoView`; the sidebar's provider and next-themes read `matchMedia`, here matching
 * nothing, which is a desktop in its light scheme.
 */
globalThis.ResizeObserver ??= class {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
} as unknown as typeof ResizeObserver;

if (typeof Element !== 'undefined') {
  Element.prototype.getAnimations ??= () => [];
  Element.prototype.scrollIntoView ??= () => undefined;
}

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
