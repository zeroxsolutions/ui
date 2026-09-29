import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PanelHeader, PanelHeaderActions, PanelHeaderRow, PanelHeaderTitle } from './panel-header';

afterEach(cleanup);

describe('PanelHeader', () => {
  it('renders the composed rows, title and actions', () => {
    render(
      <PanelHeader>
        <PanelHeaderRow>
          <PanelHeaderTitle>Title</PanelHeaderTitle>
          <PanelHeaderActions>
            <button type="button">x</button>
          </PanelHeaderActions>
        </PanelHeaderRow>
      </PanelHeader>,
    );
    expect(screen.getByText('Title').getAttribute('data-slot')).toBe('panel-header-title');
    expect(screen.getByRole('button', { name: 'x' }).closest('[data-slot="panel-header-actions"]')).toBeTruthy();
  });

  it('draws its bottom rule as a border, with no separator element', () => {
    const { container } = render(
      <PanelHeader data-testid="header">
        <PanelHeaderRow>row</PanelHeaderRow>
      </PanelHeader>,
    );
    expect(screen.getByTestId('header').className).toContain('border-b');
    expect(container.querySelector('[data-slot="separator"],[role="separator"]')).toBeNull();
  });

  it('merges className and forwards props on every part', () => {
    render(
      <PanelHeader className="bg-card" id="header">
        <PanelHeaderRow className="pb-1.5" data-testid="row">
          <PanelHeaderTitle aria-label="title" />
        </PanelHeaderRow>
      </PanelHeader>,
    );
    const row = screen.getByTestId('row');
    expect(row.className).toContain('pb-1.5');
    expect(row.parentElement?.id).toBe('header');
    expect(row.parentElement?.className).toContain('bg-card');
    expect(screen.getByLabelText('title').getAttribute('data-slot')).toBe('panel-header-title');
  });
});
