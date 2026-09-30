import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Center } from './center';

afterEach(cleanup);

describe('Center', () => {
  it('renders its children', () => {
    render(
      <Center>
        <button type="button">Retry</button>
      </Center>,
    );
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('renders the element the caller passes through render, around the children', () => {
    render(<Center render={<main />}>body</Center>);
    expect(screen.getByRole('main').textContent).toBe('body');
  });

  it('forwards the props it was not asked for', () => {
    render(<Center aria-label="Empty state">x</Center>);
    expect(screen.getByLabelText('Empty state').textContent).toBe('x');
  });
});
