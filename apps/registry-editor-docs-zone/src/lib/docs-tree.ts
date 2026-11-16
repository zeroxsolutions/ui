import { flattenTree, type Root } from 'fumadocs-core/page-tree';

import { editorDocsPageRoute, editorDocsRoute } from '@zeroxsolutions/editor-docs-web/routes';
import { editorDocsFolder } from '@zeroxsolutions/ui/site/lib/editor-docs-folder';

/**
 * `tree`, the loader's tree of the editor pages, as the one `Editor` folder `editorDocsSections` lays
 * out, each page under the title its own file gives it. The loader takes this as its tree, so the
 * sidebar, the pager and `llms.txt` all read the editor pages in that order.
 */
export function editorSection(tree: Root): Root {
  const titles = new Map(flattenTree(tree.children).map((page) => [page.url, String(page.name)]));
  const pageUrl = (name: string) => editorDocsPageRoute.build({ name });

  return {
    ...tree,
    children: [
      editorDocsFolder({ indexUrl: editorDocsRoute.build(), pageUrl, title: (name) => titles.get(pageUrl(name)) }),
    ],
  };
}

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
