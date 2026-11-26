import type { ComponentType } from 'react';

import { DESKTOP, describeVisual, MOBILE } from '../../../../test/visual';

// Next's global types declare `import.meta.glob` without Vite's module type parameter, and theirs is the
// declaration that wins, so the module shape is asserted here instead.
const MODULES = import.meta.glob(['./*.tsx', '!./*.spec.tsx', '!./__*.tsx'], { eager: true }) as Record<
  string,
  Record<string, ComponentType>
>;

describeVisual(
  'every demo',
  Object.entries(MODULES).flatMap(([path, module]) => {
    const file = path.slice('./'.length, -'.tsx'.length);
    return Object.entries(module).map(([exportName, Demo]) => ({
      name: `${file}-${exportName}`,
      render: () => <Demo />,
      widths: [DESKTOP, MOBILE],
    }));
  }),
);
