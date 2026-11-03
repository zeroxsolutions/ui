import { vi } from 'vitest';

/**
 * Every `name` the mocked `ViewTransition` in `test/setup.ts` is given, in call order. A spec
 * reads this to assert which button or column a transition names, since the mock renders no marker
 * of its own into the DOM.
 */
export const viewTransitionSpy = vi.fn<(name: unknown) => void>();
