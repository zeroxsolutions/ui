import type { Folder, Item } from 'fumadocs-core/page-tree';

import { editorDocsSections } from '../constants/editor-docs-sections';

interface EditorDocsFolderOptions {
  /** The editor docs' introduction, which the folder opens on. */
  index: Item;
  /** A page's node, by its item name; none for a name the caller has no page for. */
  page: (name: string) => Item | undefined;
}

/**
 * The sidebar's `Editor` folder: its introduction, then each of `editorDocsSections` under its title,
 * each page the node the caller hands back for it, unchanged, so whatever else a loader keeps on it
 * (its description, which `llms.txt` lists) survives. Throws for a listed page the caller has no node
 * for, so a page missing from one zone fails its build rather than leaving a gap in the sidebar.
 */
export function editorDocsFolder({ index, page }: EditorDocsFolderOptions): Folder {
  return {
    type: 'folder',
    name: 'Editor',
    children: [
      index,
      ...editorDocsSections.flatMap(({ title, pages }) => [
        { type: 'separator' as const, name: title },
        ...pages.map((name) => {
          const node = page(name);
          if (!node) throw new Error(`The editor sidebar lists "${name}", which has no page`);
          return node;
        }),
      ]),
    ],
  };
}
