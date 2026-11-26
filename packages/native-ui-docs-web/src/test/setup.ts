/**
 * Node 25 and later define a `localStorage` of their own, empty unless Node is given `--localstorage-file`, and
 * vitest 4's jsdom environment copies no window key the global already holds, so jsdom's storage never reaches a
 * spec. The remembered engine and style read it as they render. Vitest 5's jsdom environment installs it itself,
 * so this goes with that bump.
 */
const { jsdom } = globalThis as unknown as { jsdom?: { window: Window } };
if (jsdom) Object.defineProperty(globalThis, 'localStorage', { value: jsdom.window.localStorage, configurable: true });
