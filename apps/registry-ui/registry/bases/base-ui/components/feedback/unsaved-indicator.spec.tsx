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

  it('forwards the props it was not asked for', () => {
    render(<UnsavedIndicator id="unsaved" />);
    expect(screen.getByRole('img', { name: 'Unsaved changes' }).id).toBe('unsaved');
  });
});
