// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Item } from 'fumadocs-core/page-tree';
import { describe, expect, it } from 'vitest';

import { editorDocsSections } from '../constants/editor-docs-sections';
import { editorDocsFolder } from './editor-docs-folder';
import { pageTreeGroups } from './page-tree';

/** The registry's items, as `registry.json` lists them. */
const items = (
  JSON.parse(readFileSync(resolve(import.meta.dirname, '../../../registry.json'), 'utf8')) as {
    items: { name: string; categories?: string[] }[];
  }
).items;

const node = (name: string): Item => ({ type: 'page', name: `Title of ${name}`, url: `/docs/editor/${name}` });
const index: Item = { type: 'page', name: 'Editor', url: '/docs/editor' };

describe('editorDocsFolder', () => {
  it('lists the introduction alone, then each section under its title', () => {
    const groups = pageTreeGroups({ name: 'Docs', children: [editorDocsFolder({ index, page: node })] });

    expect(groups.map((group) => [group.name, group.pages.map((page) => page.url)])).toEqual([
      [undefined, ['/docs/editor']],
      ...editorDocsSections.map(({ title, pages }) => [title, pages.map((name) => `/docs/editor/${name}`)]),
    ]);
  });

  it('places the nodes it is handed as they are', () => {
    const handed = new Map(
      editorDocsSections
        .flatMap((section) => section.pages)
        .map((name) => [name, { ...node(name), description: name }]),
    );
    const folder = editorDocsFolder({ index, page: (name) => handed.get(name) });

    expect(folder.children[0]).toBe(index);
    expect(folder.children).toContain(handed.get('math-editor'));
  });

  it('refuses a listed page it has no node for', () => {
    expect(() =>
      editorDocsFolder({ index, page: (name) => (name === 'math-editor' ? undefined : node(name)) }),
    ).toThrow('"math-editor"');
  });
});

describe('editorDocsSections', () => {
  it('lists each editor item of the registry once', () => {
    const editorItems = items.filter((item) => item.categories?.includes('editor')).map((item) => item.name);

    expect(editorDocsSections.flatMap((section) => section.pages).toSorted()).toEqual(editorItems.toSorted());
  });
});
