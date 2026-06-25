import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FieldGrid } from './field-grid';

afterEach(cleanup);

describe('FieldGrid', () => {
  it('bakes the curated grid + gap decision', () => {
    const { container } = render(
      <FieldGrid>
        <span>a</span>
        <span>b</span>
      </FieldGrid>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid');
    expect(grid.className).toContain('gap-x-2');
    expect(grid.className).toContain('gap-y-1');
  });

  it('takes the column count from a passed className', () => {
    const { container } = render(
      <FieldGrid className="grid-cols-3">
        <span>a</span>
      </FieldGrid>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid-cols-3');
    expect(grid.className).toContain('gap-x-2');
  });

  it('forwards arbitrary props onto the grid element', () => {
    const { getByTestId } = render(
      <FieldGrid data-testid="grid">
        <span>a</span>
      </FieldGrid>,
    );
    expect(getByTestId('grid')).toBeTruthy();
  });
});
