import { cleanup, render, screen } from '@testing-library/react';
import type { Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

afterEach(cleanup);

/** The sidebar inside the provider the docs layout gives it. */
function renderSidebar(ui: ReactNode = <DocsSidebar tree={tree} />): void {
  render(<SidebarProvider>{ui}</SidebarProvider>);
}

describe('DocsSidebar', () => {
  it('marks the current page, and no other', () => {
    renderSidebar();

    expect(screen.getByRole('link', { name: 'Installation' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Introduction' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('link', { name: 'Button' }).getAttribute('aria-current')).toBeNull();
  });

  it('lists a link to another site, and never marks it', () => {
    const badge = 'https://ui.shadcn.com/docs/components/base/badge';
    renderSidebar(
      <DocsSidebar tree={{ ...tree, children: [...tree.children, { type: 'page', name: 'Badge', url: badge }] }} />,
    );

    expect(screen.getByRole('link', { name: 'Badge' }).getAttribute('href')).toBe(badge);
    expect(screen.getByRole('link', { name: 'Badge' }).getAttribute('aria-current')).toBeNull();
  });

  it('is the landmark named Docs', () => {
    renderSidebar();

    expect(
      screen.getByRole('navigation', { name: 'Docs' }).contains(screen.getByRole('link', { name: 'Button' })),
    ).toBe(true);
  });

  it("lists the groups it is given above the docs' own", () => {
    renderSidebar(
      <DocsSidebar tree={tree}>
        <a href="/blocks">Blocks</a>
      </DocsSidebar>,
    );

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Blocks',
      'Introduction',
      'Installation',
      'Button',
    ]);
  });
});
