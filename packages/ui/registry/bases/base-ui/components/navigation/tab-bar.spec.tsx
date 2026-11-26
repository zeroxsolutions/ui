import { cleanup, render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import { TabBar, TabBarBadge, TabBarIcon, TabBarIndicator, TabBarItem, TabBarLabel } from './tab-bar';

afterEach(cleanup);

function bar(props: Partial<ComponentProps<typeof TabBar>> = {}): ReactNode {
  return (
    <TabBar aria-label="Main" {...props}>
      <TabBarItem href="/home" active>
        <TabBarIndicator>
          <TabBarIcon>
            <svg />
          </TabBarIcon>
        </TabBarIndicator>
        <TabBarLabel>Home</TabBarLabel>
      </TabBarItem>
      <TabBarItem href="/inbox">
        <TabBarIndicator>
          <TabBarIcon>
            <svg />
          </TabBarIcon>
          <TabBarBadge>3</TabBarBadge>
        </TabBarIndicator>
        <TabBarLabel>Inbox</TabBarLabel>
      </TabBarItem>
    </TabBar>
  );
}

function root(): HTMLElement {
  return screen.getByRole('navigation', { name: 'Main' });
}

describe('TabBarItem', () => {
  it('marks the active destination as the current page', () => {
    render(bar());

    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: /Inbox/ }).hasAttribute('aria-current')).toBe(false);
  });

  it('renders the link the caller passes, such as a router link', () => {
    function RouterLink(props: ComponentProps<'a'>): ReactNode {
      return <a data-router="" {...props} />;
    }
    render(
      <TabBar aria-label="Main">
        <TabBarItem render={<RouterLink href="/search" />} active>
          <TabBarLabel>Search</TabBarLabel>
        </TabBarItem>
      </TabBar>,
    );
    const search = screen.getByRole('link', { name: 'Search' });

    expect(search.hasAttribute('data-router')).toBe(true);
    expect(search.getAttribute('href')).toBe('/search');
    expect(search.getAttribute('aria-current')).toBe('page');
  });
});

describe('TabBarIcon', () => {
  it('keeps the glyph out of what a screen reader reads', () => {
    render(bar());

    const icons = root().querySelectorAll('[data-slot=tab-bar-icon]');
    expect(icons).toHaveLength(2);
    for (const icon of icons) expect(icon.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('TabBarBadge', () => {
  it('describes its item with the count, leaving the name to the label', () => {
    render(bar());

    expect(screen.getByRole('link', { name: 'Inbox', description: '3 new' })).toBeTruthy();
  });

  it('describes its item in the server-rendered markup, before any effect runs', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(bar());
    const inbox = container.querySelector<HTMLElement>('a[href="/inbox"]');
    const badge = container.querySelector<HTMLElement>('[data-slot=tab-bar-badge]');

    expect(badge?.id).toBeTruthy();
    expect(inbox?.getAttribute('aria-describedby')).toBe(badge?.id);
  });

  it("keeps the caller's own aria-describedby beside the badge", () => {
    render(
      <>
        <p id="inbox-hint">Messages from your team</p>
        <TabBar aria-label="Main">
          <TabBarItem href="/inbox" aria-describedby="inbox-hint">
            <TabBarIndicator>
              <TabBarBadge>3</TabBarBadge>
            </TabBarIndicator>
            <TabBarLabel>Inbox</TabBarLabel>
          </TabBarItem>
        </TabBar>
      </>,
    );

    expect(screen.getByRole('link', { name: 'Inbox', description: 'Messages from your team 3 new' })).toBeTruthy();
  });

  it('says what the count counts in the words the caller passes', () => {
    render(
      <TabBar aria-label="Main">
        <TabBarItem href="/inbox">
          <TabBarIndicator>
            <TabBarBadge countLabel="nouveaux">5</TabBarBadge>
          </TabBarIndicator>
          <TabBarLabel>Boite</TabBarLabel>
        </TabBarItem>
      </TabBar>,
    );

    expect(screen.getByRole('link', { name: 'Boite', description: '5 nouveaux' })).toBeTruthy();
  });
});
