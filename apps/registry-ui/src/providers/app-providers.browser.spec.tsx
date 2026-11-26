import { ModeSwitcher } from '@zeroxsolutions/ui/site/components/general/mode-switcher';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { AppProviders } from './app-providers';

// Next's router and link exist only inside a Next app, whose bundler also inlines the `process.env` they read.
vi.mock('next/link', () => ({ __esModule: true, default: (props: ComponentProps<'a'>) => <a {...props} /> }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  localStorage.clear();
});

/** The colour scheme the page asks the browser to paint its own controls and scrollbars in. */
const colorScheme = (): string => document.documentElement.style.colorScheme;

describe('AppProviders', () => {
  it('lets the ModeSwitcher switch the page from the system theme to dark, and back', async () => {
    await render(
      <AppProviders>
        <ModeSwitcher />
      </AppProviders>,
    );
    const toggle = page.getByRole('button', { name: 'Toggle theme' });
    await expect.poll(colorScheme).toBe('light');

    await userEvent.click(toggle);
    await expect.poll(colorScheme).toBe('dark');

    await userEvent.click(toggle);
    await expect.poll(colorScheme).toBe('light');
  });
});
