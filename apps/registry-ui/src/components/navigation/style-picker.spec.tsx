import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StylePicker } from './style-picker';

const BUTTON = '/native/components/nativewind/button';

const url = vi.hoisted(() => ({ pathname: '', search: '' }));

vi.mock('next/navigation', () => ({
  usePathname: (): string => url.pathname,
  useSearchParams: (): URLSearchParams => new URLSearchParams(url.search),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeEach(() => {
  url.pathname = BUTTON;
  url.search = '';
});

function openPicker(): void {
  fireEvent.click(screen.getByRole('button', { name: /^Style/ }));
}

describe('StylePicker', () => {
  it("shows a pasted link's style over the one the reader picked last", () => {
    localStorage.setItem('zui:style:native', 'nova');
    url.search = '?style=vega';

    render(<StylePicker platform="native" />);

    expect(screen.getByRole('button', { name: /^Style/ }).textContent).toContain('Vega');
  });

  it('shows the style the reader picked last where the URL names none', () => {
    localStorage.setItem('zui:style:native', 'nova');

    render(<StylePicker platform="native" />);

    expect(screen.getByRole('button', { name: /^Style/ }).textContent).toContain('Nova');
  });

  it("links each of the platform's styles, writing no ?style= for the default and keeping the rest of the query", async () => {
    url.search = '?style=nova&q=x';
    render(<StylePicker platform="native" />);

    openPicker();

    const vega = await screen.findByRole('menuitem', { name: 'Vega' });
    const nova = screen.getByRole('menuitem', { name: 'Nova' });
    expect(vega.getAttribute('href')).toBe(`${BUTTON}?q=x`);
    expect(nova.getAttribute('href')).toBe(`${BUTTON}?style=nova&q=x`);
    expect(nova.getAttribute('aria-current')).toBe('page');
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
  });

  it('lists the web styles on a web page', async () => {
    url.pathname = '/docs/installation';
    render(<StylePicker platform="web" />);

    openPicker();

    expect((await screen.findByRole('menuitem', { name: 'Nova' })).getAttribute('href')).toBe('/docs/installation');
    expect(screen.getByRole('menuitem', { name: 'Rhea' }).getAttribute('href')).toBe('/docs/installation?style=rhea');
    expect(screen.getAllByRole('menuitem')).toHaveLength(8);
  });

  it('remembers the style a reader picks, for pages whose URL names none', async () => {
    url.pathname = '/native/docs';
    render(<StylePicker platform="native" />);
    openPicker();

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Nova' }));

    expect(screen.getByRole('button', { name: /^Style/ }).textContent).toContain('Nova');
  });
});
