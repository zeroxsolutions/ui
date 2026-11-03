import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { TestHost } from '../../../test/test-host';
import { type SiteNav, SiteNavProvider } from '../../providers/site-nav-provider';

import { PlatformSwitch } from './platform-switch';

const nav: SiteNav = {
  locate: (pathname) => ({ platform: pathname.startsWith('/native') ? 'native' : 'web' }),
  home: () => '/',
  items: () => [],
  counterpart: (pathname) => (pathname.startsWith('/native') ? '/docs' : '/native/docs'),
  withEngine: (href) => href,
};

afterEach(cleanup);

function renderAt(pathname: string): HTMLElement {
  render(
    <TestHost pathname={pathname}>
      <SiteNavProvider nav={nav}>
        <PlatformSwitch />
      </SiteNavProvider>
    </TestHost>,
  );
  return screen.getByRole('navigation', { name: 'Platform' });
}

describe('PlatformSwitch', () => {
  it('marks the platform the page is on, and links it to the page itself', () => {
    const switcher = renderAt('/docs/installation');

    const web = within(switcher).getByRole('link', { name: 'Web' });
    expect(web.getAttribute('aria-current')).toBe('page');
    expect(web.getAttribute('href')).toBe('/docs/installation');
  });

  it("links the other platform to the site nav's counterpart of the page", () => {
    const switcher = renderAt('/native/docs/installation');

    const web = within(switcher).getByRole('link', { name: 'Web' });
    expect(web.getAttribute('aria-current')).toBeNull();
    expect(web.getAttribute('href')).toBe('/docs');
  });
});
