import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { TestHost } from '../../../test/test-host';
import { type SiteNav, SiteNavProvider } from '../../providers/site-nav-provider';

import { SiteFooter } from './site-footer';

const nav: SiteNav = {
  locate: (pathname) => ({ platform: pathname.startsWith('/native') ? 'native' : 'web' }),
  home: () => '/',
  items: () => [],
  counterpart: () => '/',
  withEngine: (href) => href,
};

function renderAt(pathname: string): void {
  render(
    <TestHost pathname={pathname}>
      <SiteNavProvider nav={nav}>
        <SiteFooter />
      </SiteNavProvider>
    </TestHost>,
  );
}

afterEach(() => {
  cleanup();
});

describe('SiteFooter', () => {
  it('names Base UI on a web page', () => {
    renderAt('/');

    expect(screen.getByRole('link', { name: 'Base UI' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'NativeWind' })).toBeNull();
  });

  it('names the native engines, not Base UI, on a native page', () => {
    renderAt('/native');

    expect(screen.getByRole('link', { name: 'NativeWind' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Uniwind' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Base UI' })).toBeNull();
  });
});
