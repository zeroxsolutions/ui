import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderRow,
  PanelHeaderTitle,
} from './panel-header';

afterEach(cleanup);

describe('PanelHeader', () => {
  it('renders the compound header and a trailing separator', () => {
    const { getByText, container } = render(
      <PanelHeader>
        <PanelHeaderRow>
          <PanelHeaderTitle>Title</PanelHeaderTitle>
          <PanelHeaderActions>
            <button>x</button>
          </PanelHeaderActions>
        </PanelHeaderRow>
      </PanelHeader>,
    );
    expect(getByText('Title')).toBeTruthy();
    // PanelHeader appends a Separator after its rows.
    expect(
      container.querySelector('[data-slot="separator"],[role="separator"]'),
    ).toBeTruthy();
  });
});
