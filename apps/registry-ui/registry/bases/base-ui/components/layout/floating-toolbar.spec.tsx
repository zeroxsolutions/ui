import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FloatingToolbar } from './floating-toolbar';

afterEach(cleanup);

describe('FloatingToolbar', () => {
  it('renders a toolbar landmark named by its aria-label around its children', () => {
    render(
      <FloatingToolbar aria-label="Tools">
        <button type="button">tool</button>
      </FloatingToolbar>,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Tools' });
    expect(toolbar.getAttribute('data-slot')).toBe('floating-toolbar');
    expect(toolbar.className).toContain('pointer-events-auto');
    expect(screen.getByRole('button', { name: 'tool' }).parentElement).toBe(toolbar);
  });

  it('owns only the visual shell identity, not outer placement', () => {
    render(<FloatingToolbar aria-label="Tools">x</FloatingToolbar>);
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar.className).toContain('bg-card/95');
    expect(toolbar.className).toContain('rounded-sm');
    // Placement is the consumer's; it is not baked into the shell identity.
    expect(toolbar.className).not.toContain('absolute');
    expect(toolbar.className).not.toContain('bottom-3');
    expect(toolbar.className).not.toContain('-translate-x-1/2');
  });

  it('merges a passed className', () => {
    render(<FloatingToolbar className="bottom-6">x</FloatingToolbar>);
    expect(screen.getByRole('toolbar').className).toContain('bottom-6');
  });
});
