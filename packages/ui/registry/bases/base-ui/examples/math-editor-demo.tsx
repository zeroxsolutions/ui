'use client';

import type { ReactNode } from 'react';

import { MathEditor } from '@/registry/bases/base-ui/editor/math/react';

/** The standalone LaTeX surface: a source pane beside the live formula, over a symbol palette. */
function MathEditorDemo(): ReactNode {
  return (
    <div className="w-full max-w-2xl">
      <MathEditor defaultValue={'\\int_0^1 x^2 \\, dx = \\frac{1}{3}'} />
    </div>
  );
}

export { MathEditorDemo };
