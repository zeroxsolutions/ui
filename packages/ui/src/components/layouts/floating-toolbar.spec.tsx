import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FloatingToolbar } from './floating-toolbar';

afterEach(cleanup);

describe('FloatingToolbar', () => {
  it('renders a labelled toolbar landmark around its children', () => {
    const { getByRole } = render(
      <FloatingToolbar label="Tools">
        <button>tool</button>
      </FloatingToolbar>,
    );
    const toolbar = getByRole('toolbar', { name: 'Tools' });
    expect(toolbar).toBeTruthy();
    expect(toolbar.className).toContain('pointer-events-auto');
  });

  it('owns only the visual shell identity, not outer placement', () => {
    const { getByRole } = render(
      <FloatingToolbar label="Tools">x</FloatingToolbar>,
    );
    const toolbar = getByRole('toolbar');
    expect(toolbar.className).toContain('bg-card/95');
    expect(toolbar.className).toContain('rounded-sm');
    // Placement is the consumer's; it is not baked into the shell identity.
    expect(toolbar.className).not.toContain('absolute');
    expect(toolbar.className).not.toContain('bottom-3');
    expect(toolbar.className).not.toContain('-translate-x-1/2');
  });

  it('merges a passed className', () => {
    const { getByRole } = render(
      <FloatingToolbar className="bottom-6">x</FloatingToolbar>,
    );
    expect(getByRole('toolbar').className).toContain('bottom-6');
  });
});
