import { describe, expect, it } from 'vitest';

import type { SiteNavItem } from '@/types/site-nav-item';

import { currentSiteNavItem } from './site-nav';

const items: SiteNavItem[] = [
  { href: '/docs', label: 'Docs', pattern: '/docs{/*rest}' },
  { href: '/docs/components', label: 'Components', pattern: '/docs/components{/*rest}' },
  { href: '/blocks', label: 'Blocks', pattern: '/blocks' },
];

describe('currentSiteNavItem', () => {
  it('marks a section on its own page and on every page under it', () => {
    expect(currentSiteNavItem(items, '/docs')?.label).toBe('Docs');
    expect(currentSiteNavItem(items, '/docs/installation')?.label).toBe('Docs');
  });

  it('marks the subsection, not its parent, on a page under both', () => {
    expect(currentSiteNavItem(items, '/docs/components/status-indicator')?.label).toBe('Components');
  });

  it('marks nothing on a page no section covers', () => {
    expect(currentSiteNavItem(items, '/')).toBeUndefined();
  });
});
