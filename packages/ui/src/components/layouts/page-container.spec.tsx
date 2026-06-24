import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PageContainer } from './page-container';

afterEach(cleanup);

describe('PageContainer', () => {
  it('centers a max-width column around its children', () => {
    const { getByText } = render(<PageContainer>body</PageContainer>);
    const el = getByText('body');
    expect(el.className).toContain('mx-auto');
    expect(el.className).toContain('max-w-5xl');
  });

  it('merges a passed className (padding / width override)', () => {
    const { getByText } = render(
      <PageContainer className="px-6 max-w-3xl">body</PageContainer>,
    );
    expect(getByText('body').className).toContain('px-6');
  });
});
