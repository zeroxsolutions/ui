import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BaseSwitcher } from './base-switcher';

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
});

describe('BaseSwitcher', () => {
  it("links the component under each base, the current one marked, keeping the page's query", () => {
    url.pathname = '/docs/components/base/button';
    url.search = '?style=rhea';

    render(<BaseSwitcher />);

    const link = within(screen.getByRole('navigation', { name: 'Base' })).getByRole('link', { name: 'Base UI' });
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(link.getAttribute('href')).toBe('/docs/components/base/button?style=rhea');
  });

  it('links the blocks page under each base', () => {
    url.pathname = '/blocks/base';

    render(<BaseSwitcher />);

    const nav = screen.getByRole('navigation', { name: 'Base' });
    expect(within(nav).getByRole('link', { name: 'Base UI' }).getAttribute('href')).toBe('/blocks/base');
  });

  it('renders nothing on a page whose path holds no base', () => {
    url.pathname = '/docs/installation';

    render(<BaseSwitcher />);

    expect(screen.queryByRole('navigation', { name: 'Base' })).toBeNull();
  });
});
