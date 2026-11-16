// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

const pageUrl = (name: string) => `/docs/editor/${name}`;
const title = (name: string) => `Title of ${name}`;

describe('editorDocsFolder', () => {
  it('lists the introduction alone, then each section under its title', () => {
    const groups = pageTreeGroups({
      name: 'Docs',
      children: [editorDocsFolder({ indexUrl: '/docs/editor', pageUrl, title })],
    });

    expect(groups.map((group) => [group.name, group.pages.map((page) => page.url)])).toEqual([
      [undefined, ['/docs/editor']],
      ...editorDocsSections.map(({ title: section, pages }) => [section, pages.map(pageUrl)]),
    ]);
    expect(groups[1].pages[0].name).toBe('Title of document-editor');
  });

  it('marks every page external when asked', () => {
    const folder = editorDocsFolder({ indexUrl: '/docs/editor', pageUrl, title, external: true });
    const pages = folder.children.filter((node) => node.type === 'page');

    expect(pages.length).toBeGreaterThan(1);
    expect(pages.every((page) => page.external === true)).toBe(true);
  });

  it('refuses a listed page it has no title for', () => {
    expect(() =>
      editorDocsFolder({
        indexUrl: '/docs/editor',
        pageUrl,
        title: (name) => (name === 'math-editor' ? undefined : name),
      }),
    ).toThrow('"math-editor"');
  });
});

describe('editorDocsSections', () => {
  it('lists each editor item of the registry once', () => {
    const editorItems = items.filter((item) => item.categories?.includes('editor')).map((item) => item.name);

    expect(editorDocsSections.flatMap((section) => section.pages).toSorted()).toEqual(editorItems.toSorted());
  });
});
