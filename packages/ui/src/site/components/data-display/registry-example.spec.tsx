import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RegistryExample, RegistryExamplesProvider } from './registry-example';

afterEach(cleanup);

describe('RegistryExample', () => {
  it('renders the demo the provider holds under name', async () => {
    render(
      <RegistryExamplesProvider components={{ 'x-demo': () => <p>x</p> }}>
        <RegistryExample name="x-demo" />
      </RegistryExamplesProvider>,
    );

    expect(await screen.findByText('x')).toBeTruthy();
  });

  it('throws naming the demo when no provider holds it', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() =>
      render(
        <RegistryExamplesProvider components={{}}>
          <RegistryExample name="y-demo" />
        </RegistryExamplesProvider>,
      ),
    ).toThrow('No example named "y-demo"');
  });
});
