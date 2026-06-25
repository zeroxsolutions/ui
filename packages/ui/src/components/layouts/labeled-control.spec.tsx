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

  it('merges className and forwards arbitrary props onto the wrapper', () => {
    const { getByTestId } = render(
      <LabeledControl label="Fill" className="mt-2" data-testid="wrapper">
        <button>swatch</button>
      </LabeledControl>,
    );
    const wrapper = getByTestId('wrapper');
    expect(wrapper.className).toContain('flex-col');
    expect(wrapper.className).toContain('mt-2');
  });
});
