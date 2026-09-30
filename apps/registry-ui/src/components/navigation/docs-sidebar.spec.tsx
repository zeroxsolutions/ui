import { cleanup, render, screen } from '@testing-library/react';
import type { Root } from 'fumadocs-core/page-tree';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DocsSidebar } from './docs-sidebar';

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
});

describe('DocsSidebar', () => {
  it('marks the current page, and no other', () => {
    render(<DocsSidebar tree={tree} />);

    expect(screen.getByRole('link', { name: 'Installation' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Introduction' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('link', { name: 'Button' }).getAttribute('aria-current')).toBeNull();
  });

  it('lists a link to another site, and never marks it', () => {
    const badge = 'https://ui.shadcn.com/docs/components/base/badge';
    render(
      <DocsSidebar tree={{ ...tree, children: [...tree.children, { type: 'page', name: 'Badge', url: badge }] }} />,
    );

    expect(screen.getByRole('link', { name: 'Badge' }).getAttribute('href')).toBe(badge);
    expect(screen.getByRole('link', { name: 'Badge' }).getAttribute('aria-current')).toBeNull();
  });
});
