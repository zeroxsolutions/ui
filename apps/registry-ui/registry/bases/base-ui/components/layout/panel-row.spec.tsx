import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field, FieldLabel } from '@/registry/bases/base-ui/ui/field';

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
    expect(screen.getByRole('button', { name: 'lock' }).closest('[data-slot="panel-row-action"]')).toBeTruthy();
  });

  it('reserves the action column in the row template, with or without an action', () => {
    render(
      <PanelRow data-testid="row">
        <span>x</span>
      </PanelRow>,
    );
    expect(screen.getByTestId('row').className).toContain('grid-cols-[minmax(0,1fr)_minmax(--spacing(9),auto)]');
  });

  it('merges className and forwards arbitrary props onto the row', () => {
    render(
      <PanelRow className="mt-2" data-testid="row">
        <span>x</span>
      </PanelRow>,
    );
    const row = screen.getByTestId('row');
    expect(row.className).toContain('grid');
    expect(row.className).toContain('mt-2');
    expect(row.getAttribute('data-slot')).toBe('panel-row');
  });

  it('is not a field group, so upstream field-group selectors never match it', () => {
    render(
      <PanelRow data-testid="row">
        <Field orientation="responsive">
          <FieldLabel>Width</FieldLabel>
        </Field>
      </PanelRow>,
    );
    const row = screen.getByTestId('row');
    expect(row.className).not.toContain('group/field-group');
    expect(row.className).not.toContain('@container/field-group');
    expect(screen.getByRole('group').closest('[data-slot="field-group"]')).toBeNull();
  });
});
