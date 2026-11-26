/**
 * Node 25 and later define a `localStorage` of their own, empty unless Node is given `--localstorage-file`, and
 * vitest 4's jsdom environment copies no window key the global already holds, so jsdom's storage never reaches a
 * spec. `use-remembered-choice.ts`, behind the style picker, and `styleClassScript` read it as they run. Vitest 5's
 * jsdom environment installs it itself, so this goes with that bump.
 */
const { jsdom } = globalThis as unknown as { jsdom?: { window: Window } };
if (jsdom) Object.defineProperty(globalThis, 'localStorage', { value: jsdom.window.localStorage, configurable: true });

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
