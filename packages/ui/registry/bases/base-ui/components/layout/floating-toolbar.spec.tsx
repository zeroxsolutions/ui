import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FloatingToolbar } from './floating-toolbar';

afterEach(cleanup);

describe('FloatingToolbar', () => {
  it('is a toolbar named by its aria-label, holding the tools the caller composes', () => {
    render(
      <FloatingToolbar aria-label="Tools">
        <button type="button">Pen</button>
      </FloatingToolbar>,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Tools' });
    const pen = screen.getByRole('button', { name: 'Pen' });
    expect(toolbar.contains(pen)).toBe(true);
  });

  it('forwards the props it was not asked for', () => {
    render(
      <FloatingToolbar aria-label="Tools" aria-orientation="vertical">
        x
      </FloatingToolbar>,
    );
    expect(screen.getByRole('toolbar').getAttribute('aria-orientation')).toBe('vertical');
  });
});
