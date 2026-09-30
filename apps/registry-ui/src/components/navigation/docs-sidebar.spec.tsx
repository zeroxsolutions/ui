import { act, cleanup, render, screen } from '@testing-library/react';
import type { Root } from 'fumadocs-core/page-tree';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ReactNode } from 'react';

import { DocsSidebar, SidebarProvider } from './docs-sidebar';

vi.mock('next/navigation', () => ({ usePathname: (): string => '/docs/installation' }));

const tree: Root = {
  name: 'Docs',
  children: [
    { type: 'page', name: 'Introduction', url: '/docs' },
    { type: 'page', name: 'Installation', url: '/docs/installation' },
    {
      type: 'folder',
      name: 'Components',
      children: [{ type: 'page', name: 'Button', url: '/docs/components/button' }],
    },
  ],
};

beforeEach(() => {
  // jsdom has no matchMedia; the sidebar's provider reads it to tell a phone from a desktop.
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: false,
    media,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

/** The sidebar inside the provider the docs layout gives it. */
async function renderSidebar(ui: ReactNode = <DocsSidebar tree={tree} />): Promise<void> {
  // The layout effect restores the list's offset on mount; awaiting lets it run before a case asserts.
  await act(async () => {
    render(<SidebarProvider>{ui}</SidebarProvider>);
  });
}

/** The box the sidebar's list scrolls in; the inline restore script finds it by the same attribute. */
function listScroller(): HTMLElement {
  const scroller = screen
    .getByRole('link', { name: 'Installation' })
    .closest<HTMLElement>('[data-docs-sidebar-content]');
  if (!scroller) throw new Error('the sidebar list is not inside its scroller');
  return scroller;
}

describe('DocsSidebar', () => {
  it('marks the current page, and no other', async () => {
    await renderSidebar();

    expect(screen.getByRole('link', { name: 'Installation' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Introduction' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('link', { name: 'Button' }).getAttribute('aria-current')).toBeNull();
  });

  it('lists a link to another site, and never marks it', async () => {
    const badge = 'https://ui.shadcn.com/docs/components/base/badge';
    await renderSidebar(
      <DocsSidebar tree={{ ...tree, children: [...tree.children, { type: 'page', name: 'Badge', url: badge }] }} />,
    );

    expect(screen.getByRole('link', { name: 'Badge' }).getAttribute('href')).toBe(badge);
    expect(screen.getByRole('link', { name: 'Badge' }).getAttribute('aria-current')).toBeNull();
  });

  it('is the landmark named Docs', async () => {
    await renderSidebar();

    expect(
      screen.getByRole('navigation', { name: 'Docs' }).contains(screen.getByRole('link', { name: 'Button' })),
    ).toBe(true);
  });

  it('marks exactly the current page for the restore script to find', async () => {
    await renderSidebar();

    const marked = listScroller().querySelectorAll('[data-active]');
    expect([...marked].map((item) => item.textContent)).toEqual(['Installation']);
  });

  it('restores the offset stored for this page', async () => {
    sessionStorage.setItem('docs-sidebar-scroll', JSON.stringify({ pathname: '/docs/installation', scrollTop: 120 }));

    await renderSidebar();

    expect(listScroller().scrollTop).toBe(120);
  });

  it('ignores an offset stored for another page', async () => {
    sessionStorage.setItem('docs-sidebar-scroll', JSON.stringify({ pathname: '/docs', scrollTop: 120 }));

    await renderSidebar();

    expect(listScroller().scrollTop).toBe(0);
  });

  it('still lists the pages when the browser refuses storage', async () => {
    const refuse = (): never => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    };
    vi.stubGlobal('sessionStorage', { getItem: refuse, setItem: refuse });

    await renderSidebar();

    expect(screen.getByRole('link', { name: 'Installation' }).getAttribute('aria-current')).toBe('page');
  });
});
