import { docs } from 'collections/server';
import { llms, loader } from 'fumadocs-core/source';

import { pageMarkdown } from '@/lib/page-markdown';
import { docsRoute, docsShareImageRoute } from '@zeroxsolutions/ui-docs-web/routes';

export const source = loader({
  baseUrl: docsRoute.build(),
  source: docs.toFumadocsSource(),
});

/** `href`, a URL a route built, where a docs page answers it; `undefined` where the content has no page there yet. */
export function writtenDocsPage(href: string): string | undefined {
  return source.getPageByHref(href) ? href : undefined;
}

/**
 * The docs as Markdown, for a language model: `index()` is `llms.txt`, `page()` one page, `full()` every
 * page in one file. A page is its title and URL over the Markdown fumadocs-mdx keeps of its body, where
 * a component such as `ComponentPreview` stays as its JSX line.
 */
export const docsLlms = llms(source, { renderPage: pageMarkdown });

/** The address of a docs page's share image, which `/og/docs/[...slug]` draws at build, and its segments there. */
export function docsPageImage(page: { slugs: string[] }): { segments: string[]; url: string } {
  const segments = [...page.slugs, 'image.png'];
  return { segments, url: docsShareImageRoute.build({ slug: segments.join('/') }) };
}
