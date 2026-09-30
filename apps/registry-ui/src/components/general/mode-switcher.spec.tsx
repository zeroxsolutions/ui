import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AppProviders } from '@/providers/app-providers';

import { ModeSwitcher } from './mode-switcher';

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute('class');
  document.documentElement.removeAttribute('style');
});

describe('ModeSwitcher', () => {
  it('switches the page from the system theme to dark, and back', async () => {
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
