import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { LabeledControl } from './labeled-control';

afterEach(cleanup);

describe('LabeledControl', () => {
  it('stacks the label above the control', () => {
    const { getByText } = render(
      <LabeledControl label="Fill">
        <button>swatch</button>
      </LabeledControl>,
    );
    expect(getByText('Fill')).toBeTruthy();
    expect(getByText('swatch')).toBeTruthy();
  });
});
