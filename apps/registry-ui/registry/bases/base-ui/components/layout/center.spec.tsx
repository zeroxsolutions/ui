import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Center } from './center';

afterEach(cleanup);

describe('Center', () => {
  it('centres its children on both axes in block flow by default', () => {
    render(<Center data-testid="center">x</Center>);
    const center = screen.getByTestId('center');
    expect(center.tagName).toBe('DIV');
    expect(center.getAttribute('data-slot')).toBe('center');
    expect(center.className).toContain('items-center');
    expect(center.className).toContain('justify-center');
    expect(center.className).toContain('flex');
    expect(center.className).not.toContain('inline-flex');
  });

  it('switches to inline flow with inline', () => {
    render(
      <Center inline data-testid="center">
        x
      </Center>,
    );
    expect(screen.getByTestId('center').className).toContain('inline-flex');
  });

  it('renders the element the consumer passes through render, keeping the recipe and className', () => {
    render(<Center render={<main />} className="h-screen" />);
    const main = screen.getByRole('main');
    expect(main.getAttribute('data-slot')).toBe('center');
    expect(main.className).toContain('items-center');
    expect(main.className).toContain('h-screen');
  });
});
