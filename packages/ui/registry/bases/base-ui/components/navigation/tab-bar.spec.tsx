import { cleanup, render, screen, within } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import {
  TabBar,
  TabBarBadge,
  TabBarIcon,
  TabBarIndicator,
  TabBarItem,
  TabBarLabel,
  type TabBarLabels,
} from './tab-bar';

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

function label(text: string): HTMLElement {
  const element = within(root())
    .getAllByText(text)
    .find((node) => node.getAttribute('data-slot') === 'tab-bar-label');
  if (!element) throw new Error(`no label ${text}`);
  return element;
}

describe('TabBar', () => {
  it('is a navigation landmark named by its aria-label', () => {
    render(bar());

    expect(root().tagName).toBe('NAV');
    expect(root().getAttribute('data-slot')).toBe('tab-bar');
  });

  it.each([
    ['bottom', 'horizontal'],
    ['top', 'horizontal'],
    ['left', 'vertical'],
    ['right', 'vertical'],
  ] as const)('on the %s side lays its items out %s', (side, orientation) => {
    render(bar({ side }));

    expect(root().getAttribute('data-side')).toBe(side);
    expect(root().getAttribute('data-orientation')).toBe(orientation);
  });

  it('sits at the bottom, translucent and attached, unless told otherwise', () => {
    const { rerender } = render(bar());
    expect(root().getAttribute('data-side')).toBe('bottom');
    expect(root().getAttribute('data-surface')).toBe('translucent');
    expect(root().getAttribute('data-shape')).toBe('attached');

    rerender(bar({ surface: 'solid', shape: 'floating' }));
    expect(root().getAttribute('data-surface')).toBe('solid');
    expect(root().getAttribute('data-shape')).toBe('floating');
  });

  it.each([
    ['always', { Home: false, Inbox: false }],
    ['selected', { Home: false, Inbox: true }],
    ['none', { Home: true, Inbox: true }],
  ] as const)('with labels="%s" hides labels from sight only', (labels: TabBarLabels, hidden) => {
    render(bar({ labels }));

    expect(root().getAttribute('data-labels')).toBe(labels);
    expect(label('Home').hasAttribute('data-hidden')).toBe(hidden.Home);
    expect(label('Inbox').hasAttribute('data-hidden')).toBe(hidden.Inbox);
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Inbox' })).toBeTruthy();
  });

  it('shows every label when told nothing', () => {
    render(bar());

    expect(root().getAttribute('data-labels')).toBe('always');
    expect(label('Inbox').hasAttribute('data-hidden')).toBe(false);
  });
});

describe('TabBarItem', () => {
  it('marks the active destination as the current page, and lights its indicator', () => {
    render(bar());
    const home = screen.getByRole('link', { name: 'Home' });
    const inbox = screen.getByRole('link', { name: /Inbox/ });

    expect(home.getAttribute('aria-current')).toBe('page');
    expect(home.hasAttribute('data-active')).toBe(true);
    expect(home.querySelector('[data-slot=tab-bar-indicator]')?.hasAttribute('data-active')).toBe(true);
    expect(inbox.hasAttribute('aria-current')).toBe(false);
    expect(inbox.querySelector('[data-slot=tab-bar-indicator]')?.hasAttribute('data-active')).toBe(false);
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
    expect(search.getAttribute('data-slot')).toBe('tab-bar-item');
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
  it('is a destructive badge', () => {
    render(bar());
    const badge = root().querySelector('[data-slot=tab-bar-badge]');

    expect(badge?.textContent).toContain('3');
    expect(badge?.getAttribute('data-variant')).toBe('destructive');
  });

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
