import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PlatformPages } from '@/lib/platform-nav';

import { PlatformSwitch } from './platform-switch';

const url = vi.hoisted(() => ({ pathname: '' }));

vi.mock('next/navigation', () => ({ usePathname: (): string => url.pathname }));

const PAGES: PlatformPages = {
  web: { docs: ['', 'installation'], components: ['tab-bar'] },
  native: { docs: ['', 'installation'], components: ['tab-bar', 'button'] },
};

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderAt(pathname: string): HTMLElement {
  url.pathname = pathname;
  render(<PlatformSwitch pages={PAGES} />);
  return screen.getByRole('navigation', { name: 'Platform' });
}

describe('PlatformSwitch', () => {
  it('marks the platform the page is on, and links the other to the same page there', () => {
    const nav = renderAt('/docs/components/base/tab-bar');

    expect(within(nav).getByRole('link', { name: 'Web' }).getAttribute('aria-current')).toBe('page');
    const native = within(nav).getByRole('link', { name: 'Native' });
    expect(native.getAttribute('aria-current')).toBeNull();
    expect(native.getAttribute('href')).toBe('/native/components/nativewind/tab-bar');
  });

  it('switches from a page the other platform lacks to that section index', () => {
    const nav = renderAt('/native/components/uniwind/button');

    expect(within(nav).getByRole('link', { name: 'Native' }).getAttribute('aria-current')).toBe('page');
    expect(within(nav).getByRole('link', { name: 'Web' }).getAttribute('href')).toBe('/docs/components/base');
  });

  it('switches a web page into the engine the reader last read native pages under', () => {
    localStorage.setItem('zui:native-engine', 'uniwind');

    const nav = renderAt('/blocks/base');

    expect(within(nav).getByRole('link', { name: 'Native' }).getAttribute('href')).toBe('/native/blocks/uniwind');
  });
});
