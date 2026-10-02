import type { ReactNode } from 'react';
import { vi } from 'vitest';

import { viewTransitionSpy } from './view-transition-spy';

/**
 * `ViewTransition` is a Next canary export: Next.js references `react/experimental` (which imports
 * `./canary`) from its own ambient types, and aliases `react` to its own canary-built bundle for app
 * code at runtime. Outside that bundle, such as this test run's plain `react` package, the export does
 * not exist at all. The mock below is a pass-through standing in for it, so `docs-sidebar.tsx` and
 * `page.tsx` need no fallback of their own: every other export stays real, and a spec reads which name
 * a `<ViewTransition>` was given through `viewTransitionSpy` rather than a DOM marker, which would
 * change what the spec renders.
 */
vi.mock(import('react'), async (importOriginal) => {
  const actual = await importOriginal();
  const ViewTransition = ((props: { name?: unknown; children?: ReactNode }) => {
    viewTransitionSpy(props.name);
    return <>{props.children}</>;
  }) as typeof actual.ViewTransition;
  return { ...actual, ViewTransition };
});

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
