import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EngineSwitcher } from './engine-switcher';

const url = vi.hoisted(() => ({ pathname: '', search: '' }));

vi.mock('next/navigation', () => ({
  usePathname: (): string => url.pathname,
  useSearchParams: (): URLSearchParams => new URLSearchParams(url.search),
}));

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

    render(<EngineSwitcher />);

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
    container.innerHTML = renderToString(<EngineSwitcher />);
    url.search = '?style=nova';

    render(<EngineSwitcher />, { container, hydrate: true });

    const uniwind = within(screen.getByRole('navigation', { name: 'Engine' })).getByRole('link', { name: 'Uniwind' });
    await waitFor(() => expect(uniwind.getAttribute('href')).toBe('/native/components/uniwind/button?style=nova'));
  });

  it('remembers the engine of the page being read, for the native pages whose path holds none', () => {
    url.pathname = '/native/blocks/uniwind';

    render(<EngineSwitcher />);

    expect(localStorage.getItem('zui:native-engine')).toBe('uniwind');
  });

  it('renders nothing on a page whose path holds no engine', () => {
    url.pathname = '/native/docs/installation';

    render(<EngineSwitcher />);

    expect(screen.queryByRole('navigation', { name: 'Engine' })).toBeNull();
  });
});
