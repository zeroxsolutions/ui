import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SiteFooter } from './site-footer';

const url = vi.hoisted(() => ({ pathname: '' }));

vi.mock('next/navigation', () => ({ usePathname: (): string => url.pathname }));

afterEach(() => {
  cleanup();
});

describe('SiteFooter', () => {
  it('names Base UI on a web page', () => {
    url.pathname = '/';

    render(<SiteFooter />);

    expect(screen.getByRole('link', { name: 'Base UI' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'NativeWind' })).toBeNull();
  });

  it('names the native engines, not Base UI, on a native page', () => {
    url.pathname = '/native';

    render(<SiteFooter />);

    expect(screen.getByRole('link', { name: 'NativeWind' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Uniwind' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Base UI' })).toBeNull();
  });
});
