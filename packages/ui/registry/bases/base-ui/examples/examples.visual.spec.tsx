import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';

import { DESKTOP, describeVisual, MOBILE } from '../../../../test/visual';

// Next's global types declare `import.meta.glob` without Vite's module type parameter, and theirs is the
// declaration that wins, so the module shape is asserted here instead.
const MODULES = import.meta.glob(['./*.tsx', '!./*.spec.tsx', '!./__*.tsx'], { eager: true }) as Record<
  string,
  Record<string, ComponentType>
>;

/**
 * The demos that move under a reader's reduced-motion preference, by file, with what moves. Two captures of one
 * never match, so each is left out until it holds still.
 */
const MOVING: Record<string, string> = {
  'animated-grid-pattern-demo': 'its lit cells land on different squares from one mount to the next',
  'emoji-appearance-toggle-group-demo': "the Animated option's emoji plays its animation",
};

const files = Object.keys(MODULES).map((path) => path.slice('./'.length, -'.tsx'.length));

describeVisual(
  'every demo',
  Object.entries(MODULES).flatMap(([path, module]) => {
    const file = path.slice('./'.length, -'.tsx'.length);
    if (file in MOVING) return [];
    return Object.entries(module).map(([exportName, Demo]) => ({
      name: `${file}-${exportName}`,
      render: () => <Demo />,
      widths: [DESKTOP, MOBILE],
    }));
  }),
);

describe('the demos left out', () => {
  it('names only demos that exist', () => {
    expect(Object.keys(MOVING).filter((file) => !files.includes(file))).toEqual([]);
  });
});
