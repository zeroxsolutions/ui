import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ModelListSkeleton } from './model-list-skeleton';

afterEach(cleanup);

describe('ModelListSkeleton', () => {
  it('renders six placeholder items by default', () => {
    render(<ModelListSkeleton />);

    expect(document.querySelectorAll('[data-slot="model-list-skeleton-item"]')).toHaveLength(6);
  });

  it('renders the requested number of placeholder items, each matching the item shape', () => {
    render(<ModelListSkeleton count={3} />);

    const items = document.querySelectorAll('[data-slot="model-list-skeleton-item"]');
    expect(items).toHaveLength(3);
    // media placeholder + two text lines + a trailing control = 4 skeletons
    expect(items[0].querySelectorAll('[data-slot="skeleton"]')).toHaveLength(4);
  });
});
