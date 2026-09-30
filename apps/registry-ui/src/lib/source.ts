import { docs } from 'collections/server';
import { llms, loader } from 'fumadocs-core/source';

import { docsRoute } from '@/routes/app-routes';

export const source = loader({
  baseUrl: docsRoute.build(),
  source: docs.toFumadocsSource(),
});

/** The URL of the docs page at `slugs`. Throws for a page the content lacks, so a link to one fails the build. */
export function docsPageUrl(slugs: string[]): string {
  const page = source.getPage(slugs);
  if (!page) throw new Error(`docsPageUrl: no docs page at "${slugs.join('/')}"`);
  return page.url;
}

/**
 * The docs as Markdown, for a language model: `index()` is `llms.txt`, `page()` one page, `full()` every
 * page in one file. A page is its title and URL over the Markdown fumadocs-mdx keeps of its body, where
 * a component such as `ComponentPreview` stays as its JSX line.
 */
export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})\n\n${await page.data.getText('processed')}`,
});

/** The address of a docs page's share image, which `/og/docs/[...slug]` draws at build, and its segments there. */
export function docsPageImage(page: { slugs: string[] }): { segments: string[]; url: string } {
  const segments = [...page.slugs, 'image.png'];
  return { segments, url: `/og/docs/${segments.join('/')}` };
}
