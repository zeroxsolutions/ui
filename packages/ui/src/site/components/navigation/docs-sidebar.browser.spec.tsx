import type { Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { TestHost } from '../../../test/test-host';

import { DocsSidebar, SidebarProvider } from './docs-sidebar';

const tree: Root = {
  name: 'Docs',
  children: [
    { type: 'page', name: 'Introduction', url: '/docs' },
    { type: 'page', name: 'Installation', url: '/docs/installation' },
    {
      type: 'folder',
      name: 'Components',
      children: [{ type: 'page', name: 'Button', url: '/docs/components/button' }],
    },
  ],
};

/** The sidebar inside the provider the docs layout gives it. */
function renderSidebar(ui: ReactNode = <DocsSidebar tree={tree} />) {
  return render(
    <TestHost pathname="/docs/installation">
      <SidebarProvider>{ui}</SidebarProvider>
    </TestHost>,
  );
}

const link = (name: string) => page.getByRole('link', { name, exact: true });

describe('DocsSidebar', () => {
  it('marks the current page, and no other', async () => {
    await renderSidebar();

    await expect.element(link('Installation')).toHaveAttribute('aria-current', 'page');
    await expect.element(link('Introduction')).not.toHaveAttribute('aria-current');
    await expect.element(link('Button')).not.toHaveAttribute('aria-current');
  });

  it('lists a link to another site, and never marks it', async () => {
    const badge = 'https://ui.shadcn.com/docs/components/base/badge';
    await renderSidebar(
      <DocsSidebar tree={{ ...tree, children: [...tree.children, { type: 'page', name: 'Badge', url: badge }] }} />,
    );

    await expect.element(link('Badge')).toHaveAttribute('href', badge);
    await expect.element(link('Badge')).not.toHaveAttribute('aria-current');
  });

  it('is the landmark named Docs', async () => {
    await renderSidebar();

    await expect
      .element(page.getByRole('navigation', { name: 'Docs' }).getByRole('link', { name: 'Button' }))
      .toBeVisible();
  });

  it("lists the groups it is given above the docs' own", async () => {
    await renderSidebar(
      <DocsSidebar tree={tree}>
        <a href="/blocks">Blocks</a>
      </DocsSidebar>,
    );

    await expect
      .poll(() =>
        page
          .getByRole('link')
          .elements()
          .map((each) => each.textContent),
      )
      .toEqual(['Blocks', 'Introduction', 'Installation', 'Button']);
  });
});
