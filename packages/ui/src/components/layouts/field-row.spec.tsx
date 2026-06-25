import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FieldRow } from './field-row';

afterEach(cleanup);

describe('FieldRow', () => {
  it('renders its inputs and a provided trailing action', () => {
    const { getByText } = render(
      <FieldRow action={<button>lock</button>}>
        <span>x</span>
        <span>y</span>
      </FieldRow>,
    );
    expect(getByText('x')).toBeTruthy();
    expect(getByText('lock')).toBeTruthy();
  });

  it('reserves the fixed trailing action slot even when no action is given', () => {
    const { container } = render(
      <FieldRow>
        <span>x</span>
      </FieldRow>,
    );
    // The slot is always rendered at a single icon-button width so a row with no
    // action keeps the same right edge as one that has an action.
    expect(container.querySelector('.min-w-9')).toBeTruthy();
  });

  it('merges className and forwards arbitrary props onto the row', () => {
    const { getByTestId } = render(
      <FieldRow className="mt-2" data-testid="row">
        <span>x</span>
      </FieldRow>,
    );
    const row = getByTestId('row');
    expect(row.className).toContain('flex');
    expect(row.className).toContain('mt-2');
  });
});
