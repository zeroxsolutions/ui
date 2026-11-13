import { createElement, Fragment, type ReactNode } from 'react';
import { vi } from 'vitest';

import { viewTransitionSpy } from './view-transition-spy';

/**
 * `ViewTransition` is a React canary export, which Next aliases `react` to for app code; this run's plain
 * `react` has no such export. The mock below is a pass-through standing in for it, and a spec reads
 * which name a `<ViewTransition>` was given through `viewTransitionSpy`, since it renders no marker of
 * its own into the DOM.
 */
vi.mock(import('react'), async (importOriginal) => {
  const actual = await importOriginal();
  const ViewTransition = ((props: { name?: unknown; children?: ReactNode }) => {
    viewTransitionSpy(props.name);
    return createElement(Fragment, null, props.children);
  }) as typeof actual.ViewTransition;
  return { ...actual, ViewTransition };
});

/**
 * The browser APIs jsdom lacks that the items under test call as they mount, added only where jsdom
 * has none, so a spec that stubs one itself still wins. Base UI's scroll area, popups and toggle groups
 * measure with `ResizeObserver` and wait on `getAnimations`; cmdk scrolls the selected item with
 * `scrollIntoView`; the sidebar's provider and next-themes read `matchMedia`, here matching nothing,
 * which is a desktop in its light scheme.
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

/**
 * shiki's grammar engine inflates its inlined wasm through `Blob.prototype.stream`, which jsdom's Blob
 * lacks, as it lacks `arrayBuffer`; without it every spec that renders highlighted code rejects in the
 * background. The bytes are read with `FileReader`, which jsdom has.
 */
if (typeof Blob !== 'undefined' && typeof FileReader !== 'undefined') {
  Blob.prototype.stream ??= function stream(this: Blob): ReadableStream<Uint8Array<ArrayBuffer>> {
    return new ReadableStream({
      start: (controller) =>
        new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            controller.enqueue(new Uint8Array(reader.result as ArrayBuffer));
            controller.close();
            resolve();
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(this);
        }),
    });
  };
}
