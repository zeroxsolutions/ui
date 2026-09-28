import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PanelFieldGroup } from './panel-field-group';

afterEach(cleanup);

describe('PanelFieldGroup', () => {
  it('bakes the curated grid + gap decision', () => {
    const { container } = render(
      <PanelFieldGroup>
        <span>a</span>
        <span>b</span>
      </PanelFieldGroup>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid');
    expect(grid.className).toContain('gap-x-2');
    expect(grid.className).toContain('gap-y-1');
  });

  it('renders a (possibly dynamic) column count as a computed grid-template', () => {
    const { container } = render(
      <PanelFieldGroup cols={3}>
        <span>a</span>
      </PanelFieldGroup>,
    );
    const grid = container.firstChild as HTMLElement;
    // A computed inline template, not a `grid-cols-3` utility — so any runtime
    // count works (Tailwind can't JIT a dynamic `grid-cols-${n}`).
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
    expect(grid.className).not.toContain('grid-cols-3');
  });

  it('also accepts the column count via className', () => {
    const { container } = render(
      <PanelFieldGroup className="grid-cols-3">
        <span>a</span>
      </PanelFieldGroup>,
    );
    expect((container.firstChild as HTMLElement).className).toContain('grid-cols-3');
  });

  it('forwards arbitrary props onto the grid element', () => {
    const { getByTestId } = render(
      <PanelFieldGroup data-testid="grid">
        <span>a</span>
      </PanelFieldGroup>,
    );
    expect(getByTestId('grid')).toBeTruthy();
  });
});
