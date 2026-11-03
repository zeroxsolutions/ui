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
    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'x' })).toBeTruthy();
  });

  it('draws no separator a screen reader would announce', () => {
    render(
      <PanelHeader>
        <PanelHeaderRow>row</PanelHeaderRow>
      </PanelHeader>,
    );
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('forwards props on every part', () => {
    render(
      <PanelHeader id="header">
        <PanelHeaderRow aria-label="row">
          <PanelHeaderTitle aria-label="title" />
        </PanelHeaderRow>
      </PanelHeader>,
    );
    const row = screen.getByLabelText('row');
    expect(row.parentElement?.id).toBe('header');
    expect(row.contains(screen.getByLabelText('title'))).toBe(true);
  });
});
