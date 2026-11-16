// @vitest-environment node
import type { Root } from 'fumadocs-core/page-tree';
import { describe, expect, it } from 'vitest';

import { editorDocsSections } from '@zeroxsolutions/ui/site/constants/editor-docs-sections';

import { inEditorZone, withEditorSection, type EditorNavItem } from './editor-nav';

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

const item = (name: string, title: string, category: string): EditorNavItem => ({
  name,
  title,
  categories: [category],
});

describe('withEditorSection', () => {
  const editorItems = editorDocsSections
    .flatMap((section) => section.pages)
    .map((name) => item(name, `Title of ${name}`, 'editor'));

  it('adds the editor section after Components, as external links', () => {
    const result = withEditorSection(tree, [item('button', 'Button', 'actions'), ...editorItems]);

    expect(result.children.map((node) => node.name)).toEqual(['Introduction', 'Components', 'Editor', 'Packages']);
    const editor = result.children[2];
    if (editor.type !== 'folder') throw new Error('the Editor section is not a folder');
    expect(editor.children[0]).toEqual({ type: 'page', name: 'Editor', url: '/docs/editor', external: true });
    expect(editor.children.filter((node) => node.type === 'separator').map((node) => node.name)).toEqual(
      editorDocsSections.map((section) => section.title),
    );
    expect(editor.children).toContainEqual({
      type: 'page',
      name: 'Title of math-editor',
      url: '/docs/editor/math-editor',
      external: true,
    });
  });

  it('titles the section only from editor items', () => {
    expect(() => withEditorSection(tree, [item('math-editor', 'Math Editor', 'actions')])).toThrow('has no page');
  });

  it('leaves the tree it was given as it was', () => {
    withEditorSection(tree, editorItems);

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
