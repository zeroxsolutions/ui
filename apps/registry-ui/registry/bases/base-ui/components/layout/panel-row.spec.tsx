import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PanelRow } from './panel-row';

afterEach(cleanup);

describe('PanelRow', () => {
  it('renders its inputs and a provided trailing action', () => {
    const { getByText } = render(
      <PanelRow action={<button>lock</button>}>
        <span>x</span>
        <span>y</span>
      </PanelRow>,
    );
    expect(getByText('x')).toBeTruthy();
    expect(getByText('lock')).toBeTruthy();
  });

  it('reserves the fixed trailing action slot even when no action is given', () => {
    const { container } = render(
      <PanelRow>
        <span>x</span>
      </PanelRow>,
    );
    // The slot is always rendered at a single icon-button width so a row with no
    // action keeps the same right edge as one that has an action.
    expect(container.querySelector('.min-w-9')).toBeTruthy();
  });

  it('merges className and forwards arbitrary props onto the row', () => {
    const { getByTestId } = render(
      <PanelRow className="mt-2" data-testid="row">
        <span>x</span>
      </PanelRow>,
    );
    const row = getByTestId('row');
    expect(row.className).toContain('flex');
    expect(row.className).toContain('mt-2');
  });

  it('stamps data-slot="panel-row" on the root', () => {
    const { container } = render(
      <PanelRow>
        <span>x</span>
      </PanelRow>,
    );
    expect(container.querySelector('[data-slot="panel-row"]')).toBeTruthy();
  });
});
