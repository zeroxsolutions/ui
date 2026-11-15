// @vitest-environment node
import type { Root } from 'fumadocs-core/page-tree';
import { describe, expect, it } from 'vitest';

import { docsTree } from './docs-tree';

const EDITOR: Root = {
  name: 'Docs',
  children: [
    {
      type: 'folder',
      name: 'Editor',
      index: { type: 'page', name: 'Editor', url: '/docs/editor' },
      children: [
        { type: 'separator', name: 'Surfaces' },
        { type: 'page', name: 'Document Editor', url: '/docs/editor/document-editor' },
        { type: 'page', name: 'Math Editor', url: '/docs/editor/math-editor' },
      ],
    },
  ],
};

const WEB = [
  { title: 'Introduction', url: '/docs' },
  { title: 'Installation', url: '/docs/installation' },
];

describe('docsTree', () => {
  it('puts the web sections first, as external links', () => {
    expect(docsTree(EDITOR, WEB).children.slice(0, 2)).toEqual([
      { type: 'page', name: 'Introduction', url: '/docs', external: true },
      { type: 'page', name: 'Installation', url: '/docs/installation', external: true },
    ]);
  });

  it("keeps the editor folder's pages in their order", () => {
    expect(docsTree(EDITOR, WEB).children.slice(2)).toEqual(EDITOR.children);
  });
});
