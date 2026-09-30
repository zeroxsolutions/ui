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

  it('merges a passed className into the label', () => {
    render(<PanelFieldLabel className="mt-1">Fill</PanelFieldLabel>);
    expect(screen.getByText('Fill').className).toContain('mt-1');
  });

  it('keeps upstream field-label slot so Field selectors still reach it', () => {
    render(<PanelFieldLabel>Fill</PanelFieldLabel>);
    expect(screen.getByText('Fill').getAttribute('data-slot')).toBe('field-label');
  });
});
