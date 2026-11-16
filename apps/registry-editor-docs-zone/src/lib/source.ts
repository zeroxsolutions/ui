import { editorDocs } from 'collections/server';
import type { Root } from 'fumadocs-core/page-tree';
import { llms, loader } from 'fumadocs-core/source';

import { editorDocsShareImageRoute } from '@zeroxsolutions/editor-docs-web/routes';

import { docsTree } from '@/lib/docs-tree';
import { pageMarkdown } from '@zeroxsolutions/ui/site/lib/page-markdown';
import { webDocsRoute } from '@/routes/web-paths';
import { webDocsSections } from '@/routes/web-docs-paths';

/** The editor docs pages, `content/docs/editor`, under `/docs/editor`: every page's first slug is `editor`. */
export const source = loader({ baseUrl: webDocsRoute.build(), source: editorDocs.toFumadocsSource() });

/** The sidebar's tree: the web docs sections, then the editor pages. */
export function sidebarTree(): Root {
  return docsTree(source.pageTree, webDocsSections);
}

/** The editor docs page at `slug`, its segments below `/docs/editor`; `undefined` where none is written. */
export function editorPage(slug: string[] = []): ReturnType<typeof source.getPage> {
  return source.getPage(['editor', ...slug]);
}

/**
 * The editor docs as Markdown, for a language model: `index()` is `llms.txt`, `page()` one page, `full()`
 * every page in one file. A page is its title and URL over the Markdown fumadocs-mdx keeps of its body,
 * where a component such as `ComponentPreview` stays as its JSX line.
 */
export const docsLlms = llms(source, { renderPage: pageMarkdown });

/**
 * The address of an editor docs page's share image, which `/og/docs/editor/[...slug]` draws at build,
 * and its segments there, below `/og/docs/editor`.
 */
export function docsPageImage(page: { slugs: string[] }): { segments: string[]; url: string } {
  const segments = [...page.slugs.slice(1), 'image.png'];
  return { segments, url: editorDocsShareImageRoute.build({ slug: segments.join('/') }) };
}

/** The title and URL of each editor docs page, the introduction first: the list the 404 shows. */
export function docsSectionPages(): { title: string; url: string }[] {
  return [...source.getPages()]
    .sort((a, b) => a.slugs.length - b.slugs.length)
    .map((page) => ({ title: page.data.title, url: page.url }));
}
