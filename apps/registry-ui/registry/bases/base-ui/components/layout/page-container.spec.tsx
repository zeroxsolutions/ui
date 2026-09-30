import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PageContainer } from './page-container';

afterEach(cleanup);

describe('PageContainer', () => {
  it('renders its children at every size', () => {
    for (const size of ['sm', 'md', 'lg', 'full'] as const) {
      render(<PageContainer size={size}>{`body ${size}`}</PageContainer>);
      expect(screen.getByText(`body ${size}`)).toBeTruthy();
    }
  });

  it('forwards the props it was not asked for', () => {
    render(<PageContainer aria-label="Settings">body</PageContainer>);
    expect(screen.getByLabelText('Settings').textContent).toBe('body');
  });
});
