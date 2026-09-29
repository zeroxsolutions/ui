import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { UnsavedIndicator } from './unsaved-indicator';

afterEach(cleanup);

describe('UnsavedIndicator', () => {
  it('is an image named for the unsaved state', () => {
    render(<UnsavedIndicator />);
    expect(screen.getByRole('img', { name: 'Unsaved changes' })).toBeTruthy();
  });

  it('takes a caller label over its own', () => {
    render(<UnsavedIndicator aria-label="Modified" />);
    expect(screen.getByRole('img', { name: 'Modified' })).toBeTruthy();
  });

  it('merges a passed className', () => {
    render(<UnsavedIndicator className="size-3" />);
    expect(screen.getByRole('img', { name: 'Unsaved changes' }).className).toContain('size-3');
  });
});
