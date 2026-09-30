import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AppProviders } from '@/providers/app-providers';

import { ModeSwitcher } from './mode-switcher';

afterEach(() => {
  cleanup();
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
