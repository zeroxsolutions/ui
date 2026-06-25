import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Container } from './container';

afterEach(cleanup);

describe('Container', () => {
  it('centers a default max-width column around its children', () => {
    const { getByText } = render(<Container>body</Container>);
    const el = getByText('body');
    expect(el.className).toContain('mx-auto');
    expect(el.className).toContain('max-w-5xl');
  });

  it('binds the width to the size variant', () => {
    const { getByText } = render(<Container size="lg">body</Container>);
    expect(getByText('body').className).toContain('max-w-7xl');
  });

  it('merges a passed className for the surface padding', () => {
    const { getByText } = render(
      <Container className="px-6">body</Container>,
    );
    expect(getByText('body').className).toContain('px-6');
  });
});
