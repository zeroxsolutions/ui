import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppProviders } from '@/providers/app-providers';

import { ModeSwitcher } from './mode-switcher';

beforeEach(() => {
  // jsdom has no matchMedia; the theme provider reads it for the system's colour scheme, light here,
  // and subscribes through the older addListener.
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: false,
    media,
    addListener: () => undefined,
    removeListener: () => undefined,
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.className = '';
});

describe('ModeSwitcher', () => {
  it('switches the page from the system theme to dark, and back', async () => {
    render(
      <AppProviders>
        <ModeSwitcher />
      </AppProviders>,
    );
    const toggle = screen.getByRole('button', { name: 'Toggle theme' });

    await waitFor(() => expect(document.documentElement.classList.contains('light')).toBe(true));

    fireEvent.click(toggle);
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true));

    fireEvent.click(toggle);
    await waitFor(() => expect(document.documentElement.classList.contains('light')).toBe(true));
  });
});
