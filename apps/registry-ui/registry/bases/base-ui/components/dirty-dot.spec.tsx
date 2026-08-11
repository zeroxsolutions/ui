import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DirtyDot } from './dirty-dot';

afterEach(cleanup);

describe('DirtyDot', () => {
  it('renders a labelled dot', () => {
    const { getByLabelText } = render(<DirtyDot />);
    expect(getByLabelText('Unsaved changes')).toBeTruthy();
  });

  it('merges a passed className', () => {
    const { getByLabelText } = render(<DirtyDot className="size-3" />);
    expect(getByLabelText('Unsaved changes').className).toContain('size-3');
  });
});
