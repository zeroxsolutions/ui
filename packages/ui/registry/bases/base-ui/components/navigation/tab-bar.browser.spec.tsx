import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { TabBar, TabBarIcon, TabBarIndicator, TabBarItem, TabBarLabel, type TabBarLabels } from './tab-bar';

function bar(props: Partial<ComponentProps<typeof TabBar>> = {}): ReactNode {
  return (
    <TabBar aria-label="Main" {...props}>
      <TabBarItem href="/home" active>
        <TabBarIndicator>
          <TabBarIcon>
            <svg width={24} height={24} />
          </TabBarIcon>
        </TabBarIndicator>
        <TabBarLabel>Home</TabBarLabel>
      </TabBarItem>
      <TabBarItem href="/inbox">
        <TabBarIndicator>
          <TabBarIcon>
            <svg width={24} height={24} />
          </TabBarIcon>
        </TabBarIndicator>
        <TabBarLabel>Inbox</TabBarLabel>
      </TabBarItem>
    </TabBar>
  );
}

/** Whether a reader sees the label's text: a visually hidden label is clipped to a pixel. */
function seen(name: string): boolean {
  const { width, height } = page.getByRole('link', { name }).getByText(name).element().getBoundingClientRect();
  return width > 1 && height > 1;
}

describe('TabBar labels', () => {
  it.each([
    [undefined, { Home: true, Inbox: true }],
    ['always', { Home: true, Inbox: true }],
    ['selected', { Home: true, Inbox: false }],
    ['none', { Home: false, Inbox: false }],
  ] as const)('with labels=%s shows %o, and every link keeps its name', async (labels, shown) => {
    await render(bar(labels === undefined ? {} : { labels: labels as TabBarLabels }));

    await expect.element(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect.element(page.getByRole('link', { name: 'Inbox' })).toBeVisible();
    expect({ Home: seen('Home'), Inbox: seen('Inbox') }).toEqual(shown);
  });
});
