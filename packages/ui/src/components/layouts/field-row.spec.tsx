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

  it('reserves an aligned spacer when no action is given', () => {
    const { container } = render(
      <FieldRow>
        <span>x</span>
      </FieldRow>,
    );
    expect(container.querySelector('[aria-hidden]')).toBeTruthy();
  });
});
