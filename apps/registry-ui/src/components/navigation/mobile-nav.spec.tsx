import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Root } from 'fumadocs-core/page-tree';
import { forwardRef, useImperativeHandle } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MobileNav } from './mobile-nav';

const { startAnimation, stopAnimation } = vi.hoisted(() => ({ startAnimation: vi.fn(), stopAnimation: vi.fn() }));

vi.mock('next/navigation', () => ({ usePathname: (): string => '/docs' }));

// The icon's handle is the seam: the button drives it, and the motion behind it is lucide-animated's.
vi.mock('@/registry/bases/base-ui/ui/menu', () => ({
  MenuIcon: forwardRef(function MenuIcon(_props, ref) {
    useImperativeHandle(ref, () => ({ startAnimation, stopAnimation }));
    return null;
  }),
}));

const tree: Root = { name: 'Docs', children: [{ type: 'page', name: 'Introduction', url: '/docs' }] };

function renderNav(): void {
  render(<MobileNav tree={tree} items={[{ href: '/blocks', label: 'Blocks' }]} />);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
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

  it('plays its icon while the button is hovered, and stops it when the pointer leaves', () => {
    renderNav();
    const trigger = screen.getByRole('button', { name: 'Menu' });

    fireEvent.mouseEnter(trigger);
    expect(startAnimation).toHaveBeenCalledTimes(1);

    fireEvent.mouseLeave(trigger);
    expect(stopAnimation).toHaveBeenCalledTimes(1);
  });
});
