import type { Root } from 'fumadocs-core/page-tree';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '../../../../test/nova-style.css';
import { drawingIn, expectPlaying, playMotion, settled } from '../../../../test/motion';
import { TestHost } from '../../../test/test-host';

import { MobileNav } from './mobile-nav';

const tree: Root = { name: 'Docs', children: [{ type: 'page', name: 'Introduction', url: '/docs' }] };

function renderNav(platform: 'web' | 'native' = 'web', pathname = '/docs') {
  return render(
    <TestHost pathname={pathname}>
      <MobileNav tree={tree} items={[{ href: '/blocks', label: 'Blocks', pattern: '/blocks' }]} platform={platform} />
    </TestHost>,
  );
}

const menu = () => page.getByRole('button', { name: 'Menu' });

// The site draws its style from `<html>`, which the sheet's portal sits under.
beforeEach(() => {
  document.documentElement.classList.add('style-nova');
});

afterEach(() => {
  document.documentElement.classList.remove('style-nova');
  localStorage.clear();
});

describe('MobileNav', () => {
  it("opens a sheet listing the site's sections and the docs' pages, the current one marked", async () => {
    await renderNav();

    await userEvent.click(menu());

    const nav = page.getByRole('navigation', { name: 'Docs' });
    await expect.element(nav.getByRole('link', { name: 'Blocks' })).toBeVisible();
    await expect.element(page.getByRole('link', { name: 'Introduction' })).toHaveAttribute('aria-current', 'page');
  });

  it('closes when a link in it is followed', async () => {
    await renderNav();
    await userEvent.click(menu());

    await userEvent.click(page.getByRole('link', { name: 'Blocks' }));

    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('offers the native style picker on a native page', async () => {
    await renderNav('native', '/native/components/nativewind/button');

    await userEvent.click(menu());

    await expect.element(page.getByRole('dialog').getByRole('button', { name: /^Style\s*Vega/ })).toBeVisible();
  });

  it('offers the web style picker on a web page', async () => {
    await renderNav('web');

    await userEvent.click(menu());

    await expect.element(page.getByRole('dialog').getByRole('button', { name: /^Style\s*Nova/ })).toBeVisible();
  });
});

describe('MobileNav with motion', () => {
  playMotion();

  it('plays its icon while the pointer or the focus is on the button', async () => {
    await renderNav();

    await userEvent.hover(menu());
    await expectPlaying(menu().element(), drawingIn(menu().element()));
    await userEvent.unhover(menu());
    const rest = await settled(menu().element());

    await userEvent.tab();
    await expect.element(menu()).toHaveFocus();
    await expectPlaying(menu().element(), rest);
  });
});
