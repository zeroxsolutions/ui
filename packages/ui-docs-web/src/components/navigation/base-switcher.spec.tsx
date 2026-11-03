import { cleanup, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { TestHost } from '@zeroxsolutions/ui/test/test-host';

import { BaseSwitcher } from './base-switcher';

afterEach(() => {
  cleanup();
});

function renderAt(pathname: string, search = ''): void {
  render(<BaseSwitcher />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <TestHost pathname={pathname} search={search}>
        {children}
      </TestHost>
    ),
  });
}

describe('BaseSwitcher', () => {
  it("links the component under each base, the current one marked, keeping the page's query", () => {
    renderAt('/docs/components/base/button', 'style=rhea');

    const link = within(screen.getByRole('navigation', { name: 'Base' })).getByRole('link', { name: 'Base UI' });
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(link.getAttribute('href')).toBe('/docs/components/base/button?style=rhea');
  });

  it('links the blocks page under each base', () => {
    renderAt('/blocks/base');

    const nav = screen.getByRole('navigation', { name: 'Base' });
    expect(within(nav).getByRole('link', { name: 'Base UI' }).getAttribute('href')).toBe('/blocks/base');
  });

  it('renders nothing on a page whose path holds no base', () => {
    renderAt('/docs/installation');

    expect(screen.queryByRole('navigation', { name: 'Base' })).toBeNull();
  });
});
