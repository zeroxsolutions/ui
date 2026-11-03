import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TestHost } from '@zeroxsolutions/ui/test/test-host';

import { EngineSwitcher } from './engine-switcher';

const url = { pathname: '', search: '' };

/** A host answering the path and the query the spec last set on `url`. */
function UrlHost({ children }: { children: ReactNode }): ReactNode {
  return (
    <TestHost pathname={url.pathname} search={url.search}>
      {children}
    </TestHost>
  );
}

beforeEach(() => {
  url.search = '';
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('EngineSwitcher', () => {
  it("links the page under each engine, the current one marked, keeping the page's query", () => {
    url.pathname = '/native/components/nativewind/button';
    url.search = '?style=nova';

    render(<EngineSwitcher />, { wrapper: UrlHost });

    const nav = screen.getByRole('navigation', { name: 'Engine' });
    const nativewind = within(nav).getByRole('link', { name: 'NativeWind' });
    expect(nativewind.getAttribute('aria-current')).toBe('page');
    expect(within(nav).getByRole('link', { name: 'Uniwind' }).getAttribute('href')).toBe(
      '/native/components/uniwind/button?style=nova',
    );
  });

  it("keeps the page's query once a page prerendered without it has hydrated", async () => {
    url.pathname = '/native/components/nativewind/button';
    const container = document.body.appendChild(document.createElement('div'));
    container.innerHTML = renderToString(
      <UrlHost>
        <EngineSwitcher />
      </UrlHost>,
    );
    url.search = '?style=nova';

    render(<EngineSwitcher />, { container, hydrate: true, wrapper: UrlHost });

    const uniwind = within(screen.getByRole('navigation', { name: 'Engine' })).getByRole('link', { name: 'Uniwind' });
    await waitFor(() => expect(uniwind.getAttribute('href')).toBe('/native/components/uniwind/button?style=nova'));
  });

  it('remembers the engine of the page being read, for the native pages whose path holds none', () => {
    url.pathname = '/native/blocks/uniwind';

    render(<EngineSwitcher />, { wrapper: UrlHost });

    expect(localStorage.getItem('zui:native-engine')).toBe('uniwind');
  });

  it('renders nothing on a page whose path holds no engine', () => {
    url.pathname = '/native/docs/installation';

    render(<EngineSwitcher />, { wrapper: UrlHost });

    expect(screen.queryByRole('navigation', { name: 'Engine' })).toBeNull();
  });
});
