import { PlatformSwitch } from '@zeroxsolutions/ui/site/components/navigation/platform-switch';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { AppProviders } from './app-providers';
import { PlatformNavProvider } from './platform-nav-provider';

const url = vi.hoisted(() => ({ pathname: '' }));

// Next's router and link exist only inside a Next app, whose bundler also inlines the `process.env` they read.
vi.mock('next/link', () => ({ __esModule: true, default: (props: ComponentProps<'a'>) => <a {...props} /> }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: (): string => url.pathname,
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  localStorage.clear();
});

async function renderAt(pathname: string): Promise<void> {
  url.pathname = pathname;
  await render(
    <AppProviders>
      <PlatformNavProvider>
        <PlatformSwitch />
      </PlatformNavProvider>
    </AppProviders>,
  );
}

const platformLink = (name: string) => page.getByRole('navigation', { name: 'Platform' }).getByRole('link', { name });

describe('PlatformNavProvider', () => {
  it('marks the platform the page is on, and links the other to the same page there', async () => {
    await renderAt('/docs/components/base/tab-bar');

    await expect.element(platformLink('Web')).toHaveAttribute('aria-current', 'page');
    await expect.element(platformLink('Native')).not.toHaveAttribute('aria-current');
    await expect.element(platformLink('Native')).toHaveAttribute('href', '/native/components/nativewind/tab-bar');
  });

  it('switches a web page into the engine the reader last read native pages under', async () => {
    localStorage.setItem('zui:native-engine', 'uniwind');

    await renderAt('/blocks/base');

    await expect.element(platformLink('Native')).toHaveAttribute('href', '/native/blocks/uniwind');
  });
});
