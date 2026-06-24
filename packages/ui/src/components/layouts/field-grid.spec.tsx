import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FieldGrid } from './field-grid';

afterEach(cleanup);

describe('FieldGrid', () => {
  it('defaults to a 2-column grid', () => {
    const { container } = render(
      <FieldGrid>
        <span>a</span>
        <span>b</span>
      </FieldGrid>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid');
    expect(grid.className).toContain('grid-cols-2');
  });

  it('honours the cols prop', () => {
    const { container } = render(
      <FieldGrid cols={3}>
        <span>a</span>
      </FieldGrid>,
    );
    expect((container.firstChild as HTMLElement).className).toContain(
      'grid-cols-3',
    );
  });
});
