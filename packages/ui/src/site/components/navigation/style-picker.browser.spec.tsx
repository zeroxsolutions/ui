import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '../../../../test/nova-style.css';
import { drawingIn, expectPlaying, expectStill, playMotion, settled } from '../../../../test/motion';

import { TestHost } from '../../../test/test-host';

import { StylePicker } from './style-picker';

// The page is drawn in its style by an inline script on `<html>` before any module loads, so until the picker
// hydrates, its label is the markup the server rendered with no query and no remembered choice.
describe('StylePicker before it hydrates', () => {
  const container = document.createElement('div');

  afterEach(() => {
    container.remove();
    document.documentElement.classList.remove('style-sera');
  });

  it('names the style the page is drawn in, not the default the server rendered', async () => {
    document.documentElement.classList.add('style-sera');
    container.innerHTML = renderToString(
      <TestHost pathname="/docs/installation">
        <StylePicker platform="web" />
      </TestHost>,
    );
    document.body.append(container);

    await expect.element(page.getByRole('button', { name: 'Style Sera' })).toBeVisible();
  });
});

const BUTTON = '/native/components/nativewind/button';

/** The picker on a page at `pathname` whose query is `search`. */
function picker(platform: 'web' | 'native', pathname = BUTTON, search = '') {
  return render(
    <TestHost pathname={pathname} search={search}>
      <StylePicker platform={platform} />
    </TestHost>,
  );
}

const trigger = () => page.getByRole('button', { name: /^Style/ });

/** Draws the page in nova from `<html>`, as the site does, so the menu's portal is drawn in it too. */
function drawnInNova(): void {
  beforeEach(() => {
    document.documentElement.classList.add('style-nova');
  });
  afterEach(() => {
    document.documentElement.classList.remove('style-nova');
    localStorage.clear();
  });
}

describe('StylePicker', () => {
  drawnInNova();

  it("shows a pasted link's style over the one the reader picked last", async () => {
    localStorage.setItem('zui:style:native', 'nova');

    await picker('native', BUTTON, '?style=vega');

    await expect.element(trigger()).toHaveTextContent('Vega');
  });

  it('shows the style the reader picked last where the URL names none', async () => {
    localStorage.setItem('zui:style:native', 'nova');

    await picker('native');

    await expect.element(trigger()).toHaveTextContent('Nova');
  });

  it("links each of the platform's styles, writing no ?style= for the default and keeping the rest of the query", async () => {
    await picker('native', BUTTON, '?style=nova&q=x');

    await userEvent.click(trigger());

    await expect.element(page.getByRole('menuitem', { name: 'Vega' })).toHaveAttribute('href', `${BUTTON}?q=x`);
    const nova = page.getByRole('menuitem', { name: 'Nova' });
    await expect.element(nova).toHaveAttribute('href', `${BUTTON}?style=nova&q=x`);
    await expect.element(nova).toHaveAttribute('aria-current', 'page');
  });

  it('lists the web styles on a web page', async () => {
    await picker('web', '/docs/installation');

    await userEvent.click(trigger());

    await expect.element(page.getByRole('menuitem', { name: 'Nova' })).toHaveAttribute('href', '/docs/installation');
    await expect
      .element(page.getByRole('menuitem', { name: 'Rhea' }))
      .toHaveAttribute('href', '/docs/installation?style=rhea');
  });

  it('remembers the style a reader picks, for pages whose URL names none', async () => {
    await picker('native', '/native/docs');
    await userEvent.click(trigger());

    await userEvent.click(page.getByRole('menuitem', { name: 'Nova' }));

    await expect.element(trigger()).toHaveTextContent('Nova');
  });

  it("leaves the style in use's check as drawn under reduced motion", async () => {
    await picker('web', '/docs/installation');
    await userEvent.click(trigger());
    const item = page.getByRole('menuitem', { name: 'Nova' });
    await expect.element(item).toBeVisible();

    await userEvent.hover(item);

    await expectStill(item.element());
  });
});

describe('StylePicker with motion', () => {
  drawnInNova();
  playMotion();

  it("plays the trigger's icon while the pointer or the focus is on it", async () => {
    await picker('native');

    await userEvent.hover(trigger());
    await expectPlaying(trigger().element(), drawingIn(trigger().element()));
    await userEvent.unhover(trigger());
    const rest = await settled(trigger().element());

    await userEvent.tab();
    await expect.element(trigger()).toHaveFocus();
    await expectPlaying(trigger().element(), rest);
  });

  it('plays the check of the style in use as the highlight reaches it, and again as it comes back', async () => {
    await picker('native', BUTTON, '?style=nova');
    await userEvent.click(trigger());
    const nova = page.getByRole('menuitem', { name: 'Nova' });
    await expect.element(nova).toBeVisible();
    const rest = await settled(nova.element());

    await userEvent.hover(nova);
    await expectPlaying(nova.element(), rest);
    await userEvent.hover(page.getByRole('menuitem', { name: 'Vega' }));
    await settled(nova.element());
    await expectStill(nova.element());

    await userEvent.hover(nova);
    await expectPlaying(nova.element(), rest);
  });
});
