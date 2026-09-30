// @vitest-environment node
import type { Item, Root } from 'fumadocs-core/page-tree';
import { describe, expect, it } from 'vitest';

import { pageTreeGroups } from './page-tree';

function page(name: string, url: string): Item {
  return { type: 'page', name, url };
}

describe('pageTreeGroups', () => {
  it('groups pages under the separator or folder that precedes them, in tree order', () => {
    const tree: Root = {
      name: 'Docs',
      children: [
        page('Introduction', '/docs'),
        { type: 'separator', name: 'Get Started' },
        page('Installation', '/docs/installation'),
        {
          type: 'folder',
          name: 'Components',
          index: page('Components', '/docs/components'),
          children: [
            page('Button', '/docs/components/button'),
            {
              type: 'folder',
              name: 'Feedback',
              children: [page('Status Indicator', '/docs/components/status-indicator')],
            },
          ],
        },
        page('Changelog', '/docs/changelog'),
      ],
    };

    expect(
      pageTreeGroups(tree).map((group) => ({ name: group.name, urls: group.pages.map((item) => item.url) })),
    ).toEqual([
      { name: undefined, urls: ['/docs'] },
      { name: 'Get Started', urls: ['/docs/installation'] },
      { name: 'Components', urls: ['/docs/components', '/docs/components/button'] },
      { name: 'Feedback', urls: ['/docs/components/status-indicator'] },
      { name: undefined, urls: ['/docs/changelog'] },
    ]);
  });

  it('drops a separator or folder with no page under it', () => {
    const tree: Root = {
      name: 'Docs',
      children: [
        { type: 'separator', name: 'Empty' },
        { type: 'folder', name: 'Blocks', children: [] },
        page('Introduction', '/docs'),
      ],
    };

    expect(pageTreeGroups(tree).map((group) => group.name)).toEqual([undefined]);
  });
});
