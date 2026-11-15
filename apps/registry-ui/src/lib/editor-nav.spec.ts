// @vitest-environment node
import type { Root } from 'fumadocs-core/page-tree';
import { describe, expect, it } from 'vitest';

import type { PublishedItem } from '@zeroxsolutions/ui-docs-web/lib/published-items';

import { inEditorZone, withEditorSection } from './editor-nav';

const tree: Root = {
  name: 'Docs',
  children: [
    { type: 'page', name: 'Introduction', url: '/docs' },
    {
      type: 'folder',
      name: 'Components',
      children: [{ type: 'page', name: 'Button', url: '/docs/components/base/button' }],
    },
    { type: 'folder', name: 'Packages', children: [] },
  ],
};

const item = (name: string, title: string, category: string): PublishedItem => ({
  name,
  title,
  category,
  type: 'registry:component',
  description: '',
});

describe('withEditorSection', () => {
  it('adds the editor section after Components, as external links', () => {
    const result = withEditorSection(tree, [
      item('button', 'Button', 'actions'),
      item('math-editor', 'Math Editor', 'editor'),
      item('document-editor', 'Document Editor', 'editor'),
    ]);

    expect(result.children.map((node) => node.name)).toEqual(['Introduction', 'Components', 'Editor', 'Packages']);
    expect(result.children[2]).toEqual({
      type: 'folder',
      name: 'Editor',
      index: { type: 'page', name: 'Editor', url: '/docs/editor', external: true },
      children: [
        { type: 'page', name: 'Math Editor', url: '/docs/editor/math-editor', external: true },
        { type: 'page', name: 'Document Editor', url: '/docs/editor/document-editor', external: true },
      ],
    });
  });

  it('leaves the tree it was given as it was', () => {
    withEditorSection(tree, []);

    expect(tree.children).toHaveLength(3);
  });
});

describe('inEditorZone', () => {
  it.each(['/docs/editor', '/docs/editor/document-editor', '/docs/editor/api/search?q=a', '/docs/editor#usage'])(
    'hands %s to the editor zone',
    (href) => {
      expect(inEditorZone(href)).toBe(true);
    },
  );

  it.each(['/', '/docs', '/docs/editor-foo', '/docs/components/base/button', '/native/docs'])(
    'keeps %s in this app',
    (href) => {
      expect(inEditorZone(href)).toBe(false);
    },
  );
});
