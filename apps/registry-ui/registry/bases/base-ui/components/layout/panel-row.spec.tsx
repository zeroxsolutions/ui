import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PanelFieldGroup } from './panel-field-group';
import { PanelRow, PanelRowAction } from './panel-row';

afterEach(cleanup);

describe('PanelRow', () => {
  it('renders the fields and the action the consumer composes', () => {
    render(
      <PanelRow>
        <PanelFieldGroup cols={2}>
          <span>x</span>
          <span>y</span>
        </PanelFieldGroup>
        <PanelRowAction>
          <button type="button">lock</button>
        </PanelRowAction>
      </PanelRow>,
    );
    expect(screen.getByText('x')).toBeTruthy();
    expect(screen.getByText('y')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'lock' })).toBeTruthy();
  });

  it('forwards the props it was not asked for onto the row', () => {
    render(
      <PanelRow aria-label="Size">
        <span>x</span>
      </PanelRow>,
    );
    expect(screen.getByLabelText('Size').textContent).toBe('x');
  });
});
