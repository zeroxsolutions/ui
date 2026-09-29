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

  it('hands a runtime column count to the grid through the --cols variable', () => {
    const { container } = render(
      <PanelFieldGroup cols={3}>
        <span>a</span>
      </PanelFieldGroup>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.style.getPropertyValue('--cols')).toBe('3');
    expect(grid.style.gridTemplateColumns).toBe('');
    expect(grid.className).toContain('grid-cols-[repeat(var(--cols,1),minmax(0,1fr))]');
  });

  it('lets a grid-cols class replace the variable-driven template', () => {
    const { container } = render(
      <PanelFieldGroup className="grid-cols-3">
        <span>a</span>
      </PanelFieldGroup>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid-cols-3');
    expect(grid.className).not.toContain('var(--cols');
  });

  it('keeps a caller style beside the column variable', () => {
    const { container } = render(
      <PanelFieldGroup cols={2} style={{ rowGap: '0px' }}>
        <span>a</span>
      </PanelFieldGroup>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.style.getPropertyValue('--cols')).toBe('2');
    expect(grid.style.rowGap).toBe('0px');
  });

  it('forwards arbitrary props and stamps data-slot on the grid element', () => {
    const { getByTestId } = render(
      <PanelFieldGroup data-testid="grid">
        <span>a</span>
      </PanelFieldGroup>,
    );
    expect(getByTestId('grid').getAttribute('data-slot')).toBe('panel-field-group');
  });
});
