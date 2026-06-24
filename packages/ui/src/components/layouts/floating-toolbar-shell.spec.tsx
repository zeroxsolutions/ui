import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FloatingToolbarShell } from './floating-toolbar-shell';

afterEach(cleanup);

describe('FloatingToolbarShell', () => {
  it('renders a labelled toolbar landmark around its children', () => {
    const { getByRole } = render(
      <FloatingToolbarShell label="Tools">
        <button>tool</button>
      </FloatingToolbarShell>,
    );
    const toolbar = getByRole('toolbar', { name: 'Tools' });
    expect(toolbar).toBeTruthy();
    expect(toolbar.className).toContain('pointer-events-auto');
  });

  it('merges a passed className', () => {
    const { getByRole } = render(
      <FloatingToolbarShell className="bottom-6">x</FloatingToolbarShell>,
    );
    expect(getByRole('toolbar').className).toContain('bottom-6');
  });
});
