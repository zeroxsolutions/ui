import type { Item, Node, Root } from 'fumadocs-core/page-tree';

import type { PublishedItem } from '@zeroxsolutions/ui-docs-web/lib/published-items';

import { editorDocsPageRoute, editorDocsRoute } from '@/routes/editor-paths';

/** Whether `href` is a page of the editor zone: `/docs/editor` or a path under it, with or without a query or a hash. */
export function inEditorZone(href: string): boolean {
  const path = href.split(/[?#]/, 1)[0];
  return path === editorDocsRoute.pathname || path.startsWith(`${editorDocsRoute.pathname}/`);
}

function editorPage(name: string, url: string): Item {
  return { type: 'page', name, url, external: true };
}

/**
 * `tree` with a folder `Editor` after its `Components` folder: its index is the editor docs'
 * introduction and its pages are the `editor` items, in `registry.json`'s order. Each is marked
 * `external`, since the editor zone serves them and a link to one loads the whole document.
 */
export function withEditorSection(tree: Root, items: PublishedItem[]): Root {
  const editor: Node = {
    type: 'folder',
    name: 'Editor',
    index: editorPage('Editor', editorDocsRoute.build()),
    children: items
      .filter((item) => item.category === 'editor')
      .map((item) => editorPage(item.title, editorDocsPageRoute.build({ name: item.name }))),
  };
  const after = tree.children.findIndex((node) => node.type === 'folder' && node.name === 'Components');
  const at = after === -1 ? tree.children.length : after + 1;
  return { ...tree, children: [...tree.children.slice(0, at), editor, ...tree.children.slice(at)] };
}
