// @vitest-environment node
import type { Root } from 'fumadocs-core/page-tree';
import { describe, expect, it } from 'vitest';

import { editorDocsSections } from '@zeroxsolutions/ui/site/constants/editor-docs-sections';

import { docsTree, editorSection } from './docs-tree';

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

describe('editorSection', () => {
  const names = editorDocsSections.flatMap((section) => section.pages);
  const pages = names.toReversed().map((name) => ({
    type: 'page' as const,
    name: `Title of ${name}`,
    url: `/docs/editor/${name}`,
    description: `About ${name}`,
  }));
  const index = { type: 'page' as const, name: 'Editor', url: '/docs/editor', description: 'The editors' };
  const loaded: Root = { name: 'Docs', children: [{ type: 'folder', name: 'editor', index, children: pages }] };

  it("lays the loader's own page nodes out in the sidebar's sections", () => {
    const [folder] = editorSection(loaded).children;
    if (folder.type !== 'folder') throw new Error('the Editor section is not a folder');
    const placed = folder.children.filter((node) => node.type === 'page');

    expect(folder.name).toBe('Editor');
    expect(placed.map((node) => node.url)).toEqual(['/docs/editor', ...names.map((name) => `/docs/editor/${name}`)]);
    // The same objects, so a description the llms index reads off each node is still there.
    expect(placed[0]).toBe(index);
    expect(placed.slice(1).every((node) => pages.includes(node as (typeof pages)[number]))).toBe(true);
  });
});
