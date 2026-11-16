import { flattenTree, type Root } from 'fumadocs-core/page-tree';

import { editorDocsPageRoute, editorDocsRoute } from '@zeroxsolutions/editor-docs-web/routes';
import { editorDocsFolder } from '@zeroxsolutions/ui/site/lib/editor-docs-folder';

/**
 * `tree`, the loader's tree of the editor pages, as the one `Editor` folder `editorDocsSections` lays
 * out. Each page is the loader's own node, moved rather than rebuilt, so its description still reaches
 * `llms.txt`. The loader takes this as its tree, so the sidebar, the pager and `llms.txt` all read the
 * editor pages in that order.
 */
export function editorSection(tree: Root): Root {
  const nodes = new Map(flattenTree(tree.children).map((node) => [node.url, node]));
  const index = nodes.get(editorDocsRoute.build());
  if (!index) throw new Error('The editor docs have no introduction');

  return {
    ...tree,
    children: [editorDocsFolder({ index, page: (name) => nodes.get(editorDocsPageRoute.build({ name })) })],
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
