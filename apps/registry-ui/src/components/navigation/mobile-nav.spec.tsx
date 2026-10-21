import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { Root } from 'fumadocs-core/page-tree';
import { forwardRef, useImperativeHandle } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MobileNav } from './mobile-nav';

const { startAnimation, stopAnimation } = vi.hoisted(() => ({ startAnimation: vi.fn(), stopAnimation: vi.fn() }));

const url = vi.hoisted(() => ({ pathname: '/docs' }));

vi.mock('next/navigation', () => ({
  usePathname: (): string => url.pathname,
  useSearchParams: (): URLSearchParams => new URLSearchParams(),
}));

// The icon's handle is the seam: the button drives it, and the motion behind it is the icon's own.
vi.mock('@/registry/bases/base-ui/icons/menu-icon', () => ({
  MenuIcon: forwardRef(function MenuIcon(_props, ref) {
    useImperativeHandle(ref, () => ({ startAnimation, stopAnimation }));
    return null;
  }),
}));

const tree: Root = { name: 'Docs', children: [{ type: 'page', name: 'Introduction', url: '/docs' }] };

function renderNav(platform: 'web' | 'native' = 'web'): void {
  render(
    <MobileNav tree={tree} items={[{ href: '/blocks', label: 'Blocks', pattern: '/blocks' }]} platform={platform} />,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  url.pathname = '/docs';
});

describe('MobileNav', () => {
  it("opens a sheet listing the site's sections and the docs' pages, the current one marked", async () => {
    renderNav();

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    const nav = await screen.findByRole('navigation', { name: 'Docs' });
    expect(nav.contains(screen.getByRole('link', { name: 'Blocks' }))).toBe(true);
    expect(screen.getByRole('link', { name: 'Introduction' }).getAttribute('aria-current')).toBe('page');
  });

  it('closes when a link in it is followed', async () => {
    renderNav();
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    fireEvent.click(await screen.findByRole('link', { name: 'Blocks' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('offers the native style picker on a native page', async () => {
    url.pathname = '/native/components/nativewind/button';
    renderNav('native');

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).getByRole('button', { name: /^Style\s*Vega/ })).toBeTruthy();
  });

  it('offers the web style picker on a web page', async () => {
    renderNav('web');

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).getByRole('button', { name: /^Style\s*Nova/ })).toBeTruthy();
  });

  it('plays its icon while the button is hovered, and stops it when the pointer leaves', () => {
    renderNav();
    const trigger = screen.getByRole('button', { name: 'Menu' });

    fireEvent.mouseEnter(trigger);
    expect(startAnimation).toHaveBeenCalledTimes(1);

    fireEvent.mouseLeave(trigger);
    expect(stopAnimation).toHaveBeenCalledTimes(1);
  });
});
