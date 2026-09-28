import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PageContainer } from './page-container';

afterEach(cleanup);

describe('PageContainer', () => {
  it('centers a default max-width column around its children', () => {
    const { getByText } = render(<PageContainer>body</PageContainer>);
    const el = getByText('body');
    expect(el.className).toContain('mx-auto');
    expect(el.className).toContain('max-w-5xl');
  });

  it('binds the width to the size variant', () => {
    const { getByText } = render(<PageContainer size="lg">body</PageContainer>);
    expect(getByText('body').className).toContain('max-w-7xl');
  });

  it('merges a passed className for the surface padding', () => {
    const { getByText } = render(<PageContainer className="px-6">body</PageContainer>);
    expect(getByText('body').className).toContain('px-6');
  });
});
