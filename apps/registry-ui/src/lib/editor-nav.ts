import type { Root } from 'fumadocs-core/page-tree';

import { editorDocsFolder } from '@zeroxsolutions/ui/site/lib/editor-docs-folder';

import { editorDocsPageRoute, editorDocsRoute } from '@/routes/editor-paths';

/** Whether `href` is a page of the editor zone: `/docs/editor` or a path under it, with or without a query or a hash. */
export function inEditorZone(href: string): boolean {
  const path = href.split(/[?#]/, 1)[0];
  return path === editorDocsRoute.pathname || path.startsWith(`${editorDocsRoute.pathname}/`);
}

/** A `registry.json` item, as far as the Editor section reads it. */
export interface EditorNavItem {
  name: string;
  title: string;
  categories?: string[];
}

/**
 * `tree` with the `Editor` folder after its `Components` folder, laid out as the editor zone lays out
 * its own: the introduction, then each section's pages, titled from `items`, every `registry.json` item in the `editor` category, its libraries included. Each is marked `external`,
 * since the editor zone serves them and a link to one loads the whole document.
 */
export function withEditorSection(tree: Root, items: EditorNavItem[]): Root {
  const titles = new Map(
    items.filter((item) => item.categories?.includes('editor')).map((item) => [item.name, item.title]),
  );
  const editor = editorDocsFolder({
    indexUrl: editorDocsRoute.build(),
    pageUrl: (name) => editorDocsPageRoute.build({ name }),
    title: (name) => titles.get(name),
    external: true,
  });
  const after = tree.children.findIndex((node) => node.type === 'folder' && node.name === 'Components');
  const at = after === -1 ? tree.children.length : after + 1;
  return { ...tree, children: [...tree.children.slice(0, at), editor, ...tree.children.slice(at)] };
}
