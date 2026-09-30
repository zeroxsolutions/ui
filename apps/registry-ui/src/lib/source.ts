import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';

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
