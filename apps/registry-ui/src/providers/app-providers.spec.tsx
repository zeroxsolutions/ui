import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ModeSwitcher } from '@zeroxsolutions/ui/site/components/general/mode-switcher';

import { AppProviders } from './app-providers';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute('class');
  document.documentElement.removeAttribute('style');
});

describe('AppProviders', () => {
  it('lets the ModeSwitcher switch the page from the system theme to dark, and back', async () => {
    render(
      <AppProviders>
        <ModeSwitcher />
      </AppProviders>,
    );
    const toggle = screen.getByRole('button', { name: 'Toggle theme' });

    // The colour scheme the page asks the browser to paint its own controls and scrollbars in.
    const colorScheme = (): string => document.documentElement.style.colorScheme;
    await waitFor(() => expect(colorScheme()).toBe('light'));

    fireEvent.click(toggle);
    await waitFor(() => expect(colorScheme()).toBe('dark'));

    fireEvent.click(toggle);
    await waitFor(() => expect(colorScheme()).toBe('light'));
  });
});
