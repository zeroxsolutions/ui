import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@/registry/bases/base-ui/ui/field';

import { PanelFieldLabel } from './panel-field-label';

afterEach(cleanup);

describe('PanelFieldLabel', () => {
  it('labels the control of the upstream Field it sits in', () => {
    render(
      <Field>
        <PanelFieldLabel htmlFor="fill">Fill</PanelFieldLabel>
        <input id="fill" />
      </Field>,
    );
    expect(screen.getByLabelText('Fill').id).toBe('fill');
  });

  it('forwards the props it was not asked for onto the label', () => {
    render(<PanelFieldLabel id="fill-label">Fill</PanelFieldLabel>);
    expect(screen.getByText('Fill').id).toBe('fill-label');
  });
});
