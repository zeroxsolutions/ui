import type { Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';
import { expect } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { DESKTOP, describeVisual, MOBILE } from '../../../../test/visual';
import { TestHost } from '../../../test/test-host';
import { type SiteNav, SiteNavProvider } from '../../providers/site-nav-provider';
import { LinkTabs, LinkTabsItem } from '../navigation/link-tabs';
import { PlatformSwitch } from '../navigation/platform-switch';
import { SiteHeader } from './site-header';

const PATHNAME = '/docs/components/button';

const nav: SiteNav = {
  locate: () => ({ platform: 'web' }),
  home: () => '/',
  items: () => [
    { href: '/docs', label: 'Docs', pattern: '/docs' },
    { href: '/docs/components', label: 'Components', pattern: '/docs/components{/*rest}' },
    { href: '/blocks', label: 'Blocks', pattern: '/blocks' },
  ],
  counterpart: () => '/native/docs/components/button',
  withEngine: (href) => href,
};

const tree: Root = {
  name: 'Docs',
  children: [
    { type: 'page', name: 'Introduction', url: '/docs' },
    {
      type: 'folder',
      name: 'Components',
      defaultOpen: true,
      children: [{ type: 'page', name: 'Button', url: PATHNAME }],
    },
  ],
};

/** `children` on the docs' host and nav, on the button's page. */
function OnTheDocs({ children }: { children: ReactNode }): ReactNode {
  return (
    <TestHost pathname={PATHNAME}>
      <SiteNavProvider nav={nav}>{children}</SiteNavProvider>
    </TestHost>
  );
}

const header = (): ReactNode => (
  <OnTheDocs>
    <SiteHeader nav={{ trees: { web: tree }, searchApi: '/api/search' }} />
  </OnTheDocs>
);

describeVisual('the docs chrome', [
  { name: 'site-header', widths: [DESKTOP, MOBILE], render: header },
  {
    name: 'style-picker-open',
    window: true,
    render: header,
    arrange: async () => {
      await userEvent.click(page.getByRole('button', { name: /^Style/ }));
      await expect.element(page.getByRole('menu')).toBeVisible();
      return undefined;
    },
  },
  {
    name: 'mobile-menu-open',
    window: true,
    widths: [MOBILE],
    render: header,
    arrange: async () => {
      await userEvent.click(page.getByRole('button', { name: 'Menu' }));
      await expect.element(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
      return undefined;
    },
  },
  {
    name: 'platform-switch',
    render: () => (
      <OnTheDocs>
        <PlatformSwitch />
      </OnTheDocs>
    ),
  },
  {
    name: 'link-tabs',
    render: () => (
      <OnTheDocs>
        <LinkTabs aria-label="Base">
          <LinkTabsItem path={PATHNAME} current>
            Base UI
          </LinkTabsItem>
          <LinkTabsItem path="/docs/components/radix/button" current={false}>
            Radix
          </LinkTabsItem>
        </LinkTabs>
      </OnTheDocs>
    ),
  },
]);
