import type { Root } from 'fumadocs-core/page-tree';

/**
 * The sidebar's tree: each of `web`'s sections as a link marked `external`, since registry-ui serves
 * those pages and a link to one has to load the whole document, then the editor pages as `editor`
 * lists them.
 */
export function docsTree(editor: Root, web: { title: string; url: string }[]): Root {
  return {
    ...editor,
    children: [
      ...web.map(({ title, url }) => ({ type: 'page' as const, name: title, url, external: true })),
      ...editor.children,
    ],
  };
}
