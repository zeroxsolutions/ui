import { vi } from 'vitest';

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

/**
 * No spec here asserts highlighting, and a code block imports Shiki only once it has mounted: a spec
 * that ends first tears the environment down under that import, which fails the run as an unhandled
 * rejection. The block then shows its code unhighlighted, as it does until Shiki answers.
 */
vi.mock('@/registry/bases/base-ui/lib/shiki', () => ({ highlightToLines: async () => null }));
