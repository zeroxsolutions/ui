import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type Host, HostProvider, useHost } from './host-provider';

afterEach(cleanup);

function buildHost(overrides: Partial<Host> = {}): Host {
  return {
    Link: (props) => <a {...props} />,
    usePathname: () => '/components',
    useSearchParams: () => new URLSearchParams('q=button'),
    push: vi.fn(),
    replace: vi.fn(),
    ...overrides,
  };
}

function Probe() {
  const host = useHost();
  return (
    <host.Link href="/docs">
      {host.usePathname()}?{host.useSearchParams().get('q')}
    </host.Link>
  );
}

describe('useHost', () => {
  it('throws outside a HostProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Probe />)).toThrow('useHost needs a HostProvider');
  });
});

describe('HostProvider', () => {
  it('hands its host to useHost', () => {
    render(
      <HostProvider host={buildHost()}>
        <Probe />
      </HostProvider>,
    );

    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/docs');
    expect(link.textContent).toBe('/components?button');
  });
});
