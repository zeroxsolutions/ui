import { act, cleanup, render, screen } from '@testing-library/react';
import type { Root } from 'fumadocs-core/page-tree';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ReactNode } from 'react';

import { DocsSidebar, DocsSidebarProvider } from './docs-sidebar';

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
  // The scroll area measures itself once mounted; awaiting lets that settle before a case asserts.
  await act(async () => {
    render(<DocsSidebarProvider>{ui}</DocsSidebarProvider>);
  });
}

/** The box the sidebar's list scrolls in. */
function listViewport(): HTMLElement {
  const viewport = screen
    .getByRole('link', { name: 'Installation' })
    .closest<HTMLElement>('[data-slot="scroll-area-viewport"]');
  if (!viewport) throw new Error('the sidebar list is not inside a scroll area');
  return viewport;
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

  it('restores the offset stored for this page', async () => {
    sessionStorage.setItem('docs-sidebar-scroll', JSON.stringify({ pathname: '/docs/installation', scrollTop: 120 }));

    await renderSidebar();

    expect(listViewport().scrollTop).toBe(120);
  });

  it('ignores an offset stored for another page', async () => {
    sessionStorage.setItem('docs-sidebar-scroll', JSON.stringify({ pathname: '/docs', scrollTop: 120 }));

    await renderSidebar();

    expect(listViewport().scrollTop).toBe(0);
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
