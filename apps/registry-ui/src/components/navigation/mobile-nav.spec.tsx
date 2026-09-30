import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Root } from 'fumadocs-core/page-tree';
import { forwardRef, useImperativeHandle } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MobileNav } from './mobile-nav';

const { startAnimation, stopAnimation } = vi.hoisted(() => ({ startAnimation: vi.fn(), stopAnimation: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: () => undefined }) }));

// The icon's handle is the seam: the menu drives it, and the motion behind it is lucide-animated's.
vi.mock('@/registry/bases/base-ui/ui/menu', () => ({
  MenuIcon: forwardRef(function MenuIcon(_props, ref) {
    useImperativeHandle(ref, () => ({ startAnimation, stopAnimation }));
    return null;
  }),
}));

const tree: Root = { name: 'Docs', children: [{ type: 'page', name: 'Introduction', url: '/docs' }] };

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('MobileNav', () => {
  it("plays its icon's animation while the menu is open and reverses it on close", async () => {
    render(<MobileNav tree={tree} items={[{ href: '/blocks', label: 'Blocks' }]} />);
    const trigger = screen.getByRole('button', { name: /menu/i });
    stopAnimation.mockClear();

    fireEvent.click(trigger);
    expect(await screen.findByRole('navigation', { name: 'Docs' })).toBeTruthy();
    expect(startAnimation).toHaveBeenCalledTimes(1);
    expect(stopAnimation).not.toHaveBeenCalled();

    fireEvent.click(trigger);
    await waitFor(() => expect(stopAnimation).toHaveBeenCalledTimes(1));
  });
});
