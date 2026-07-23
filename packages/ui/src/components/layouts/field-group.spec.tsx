import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FieldGroup } from './field-group';

afterEach(cleanup);

describe('FieldGroup', () => {
  it('renders its inputs and a provided trailing action', () => {
    const { getByText } = render(
      <FieldGroup action={<button>lock</button>}>
        <span>x</span>
        <span>y</span>
      </FieldGroup>,
    );
    expect(getByText('x')).toBeTruthy();
    expect(getByText('lock')).toBeTruthy();
  });

  it('reserves the fixed trailing action slot even when no action is given', () => {
    const { container } = render(
      <FieldGroup>
        <span>x</span>
      </FieldGroup>,
    );
    // The slot is always rendered at a single icon-button width so a row with no
    // action keeps the same right edge as one that has an action.
    expect(container.querySelector('.min-w-9')).toBeTruthy();
  });

  it('merges className and forwards arbitrary props onto the row', () => {
    const { getByTestId } = render(
      <FieldGroup className="mt-2" data-testid="row">
        <span>x</span>
      </FieldGroup>,
    );
    const row = getByTestId('row');
    expect(row.className).toContain('flex');
    expect(row.className).toContain('mt-2');
  });

  it('stamps data-slot="field-group" on the root', () => {
    const { container } = render(
      <FieldGroup>
        <span>x</span>
      </FieldGroup>,
    );
    expect(
      container.querySelector('[data-slot="field-group"]'),
    ).toBeTruthy();
  });
});
