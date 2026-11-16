import type { Folder, Item } from 'fumadocs-core/page-tree';

import { editorDocsSections } from '../constants/editor-docs-sections';

interface EditorDocsFolderOptions {
  /** The editor docs' introduction, which the folder opens on. */
  indexUrl: string;
  /** A page's address, by its item name. */
  pageUrl: (name: string) => string;
  /** A page's title, by its item name; none for a name the caller has no page for. */
  title: (name: string) => string | undefined;
  /** Whether the pages are another zone's, so a link to one loads the whole document. */
  external?: boolean;
}

/**
 * The sidebar's `Editor` folder: its introduction, then each of `editorDocsSections` under its title.
 * Throws for a listed page `title` has no title for, so a page missing from one zone fails its build
 * rather than leaving a gap in the sidebar.
 */
export function editorDocsFolder({ indexUrl, pageUrl, title, external }: EditorDocsFolderOptions): Folder {
  const page = (name: string, url: string): Item =>
    external ? { type: 'page', name, url, external } : { type: 'page', name, url };

  return {
    type: 'folder',
    name: 'Editor',
    children: [
      page('Editor', indexUrl),
      ...editorDocsSections.flatMap(({ title: section, pages }) => [
        { type: 'separator' as const, name: section },
        ...pages.map((name) => {
          const pageTitle = title(name);
          if (pageTitle === undefined) throw new Error(`The editor sidebar lists "${name}", which has no page`);
          return page(pageTitle, pageUrl(name));
        }),
      ]),
    ],
  };
}
