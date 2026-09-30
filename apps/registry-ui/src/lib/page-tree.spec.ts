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
        { type: 'separator', name: 'Get started' },
        page('Installation', '/docs/installation'),
        {
          type: 'folder',
          name: 'Components',
          // fumadocs sorts a folder's own index page first among its children, never inside `index`.
          children: [
            page('Components', '/docs/components'),
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
      { name: 'Get started', urls: ['/docs/installation'] },
      // Components' own index page repeats the folder's name, already the group's heading above it,
      // so it is left out; nothing else is left in the folder's own group, and it is gone too.
      { name: 'Feedback', urls: ['/docs/components/status-indicator'] },
      { name: undefined, urls: ['/docs/changelog'] },
    ]);
  });

  it("keeps a folder's own leading page where its name differs from the folder's", () => {
    const tree: Root = {
      name: 'Docs',
      children: [
        {
          type: 'folder',
          name: 'Feedback',
          children: [
            page('Overview', '/docs/components/feedback'),
            page('Status Indicator', '/docs/components/status-indicator'),
          ],
        },
      ],
    };

    expect(pageTreeGroups(tree)).toEqual([
      {
        name: 'Feedback',
        pages: [
          page('Overview', '/docs/components/feedback'),
          page('Status Indicator', '/docs/components/status-indicator'),
        ],
      },
    ]);
  });

  it("puts a folder's index page first when its meta.json keeps it apart from the children", () => {
    const tree: Root = {
      name: 'Docs',
      children: [
        {
          type: 'folder',
          name: 'Feedback',
          index: page('Overview', '/docs/components/feedback'),
          children: [page('Status Indicator', '/docs/components/status-indicator')],
        },
      ],
    };

    expect(pageTreeGroups(tree)[0]?.pages.map((item) => item.url)).toEqual([
      '/docs/components/feedback',
      '/docs/components/status-indicator',
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
