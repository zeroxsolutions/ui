import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PanelFieldGroup } from './panel-field-group';

afterEach(cleanup);

describe('PanelFieldGroup', () => {
  it('hands a runtime column count to the grid through the --cols variable', () => {
    const { container } = render(
      <PanelFieldGroup cols={3}>
        <span>a</span>
      </PanelFieldGroup>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.style.getPropertyValue('--cols')).toBe('3');
    expect(grid.style.gridTemplateColumns).toBe('');
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

  it('forwards the props it was not asked for onto the grid', () => {
    const { getByLabelText } = render(
      <PanelFieldGroup aria-label="Position">
        <span>a</span>
      </PanelFieldGroup>,
    );
    expect(getByLabelText('Position').textContent).toBe('a');
  });
});
