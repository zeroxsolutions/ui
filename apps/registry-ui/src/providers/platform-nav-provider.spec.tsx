import { cleanup, render, screen, within } from '@testing-library/react';
import { PlatformSwitch } from '@zeroxsolutions/ui/site/components/navigation/platform-switch';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppProviders } from './app-providers';
import { PlatformNavProvider } from './platform-nav-provider';

const url = vi.hoisted(() => ({ pathname: '' }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: (): string => url.pathname,
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderAt(pathname: string): HTMLElement {
  url.pathname = pathname;
  render(
    <AppProviders>
      <PlatformNavProvider>
        <PlatformSwitch />
      </PlatformNavProvider>
    </AppProviders>,
  );
  return screen.getByRole('navigation', { name: 'Platform' });
}

describe('PlatformNavProvider', () => {
  it('marks the platform the page is on, and links the other to the same page there', () => {
    const switcher = renderAt('/docs/components/base/tab-bar');

    expect(within(switcher).getByRole('link', { name: 'Web' }).getAttribute('aria-current')).toBe('page');
    const native = within(switcher).getByRole('link', { name: 'Native' });
    expect(native.getAttribute('aria-current')).toBeNull();
    expect(native.getAttribute('href')).toBe('/native/components/nativewind/tab-bar');
  });

  it('links a page the native tree lacks to the same place there, which answers 404 with its section', () => {
    const switcher = renderAt('/docs/components/base/copy-button');

    expect(within(switcher).getByRole('link', { name: 'Native' }).getAttribute('href')).toBe(
      '/native/components/nativewind/copy-button',
    );
  });

  it('switches a web page into the engine the reader last read native pages under', () => {
    localStorage.setItem('zui:native-engine', 'uniwind');

    const switcher = renderAt('/blocks/base');

    expect(within(switcher).getByRole('link', { name: 'Native' }).getAttribute('href')).toBe('/native/blocks/uniwind');
  });
});
