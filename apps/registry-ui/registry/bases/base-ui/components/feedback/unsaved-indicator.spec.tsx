import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { UnsavedIndicator } from './unsaved-indicator';

afterEach(cleanup);

describe('UnsavedIndicator', () => {
  it('renders a labelled dot', () => {
    const { getByLabelText } = render(<UnsavedIndicator />);
    expect(getByLabelText('Unsaved changes')).toBeTruthy();
  });

  it('merges a passed className', () => {
    const { getByLabelText } = render(<UnsavedIndicator className="size-3" />);
    expect(getByLabelText('Unsaved changes').className).toContain('size-3');
  });
});
