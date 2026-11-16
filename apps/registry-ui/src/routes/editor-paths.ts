import { createDynamicRoute, createStaticRoute } from '@zeroxsolutions/routing';

/**
 * The editor paths this app links to, which the editor docs zone answers on the same host. This app may
 * not import the zone's packages, so they are written again here, with the values of the zone's
 * routes; a link built from them is a plain anchor, since this app has no page at any of them.
 */

/** The editor docs' introduction. */
export const editorDocsRoute = createStaticRoute('/docs/editor', () => '/docs/editor');

/** One editor docs page by its name (`document-editor`). */
export const editorDocsPageRoute = createDynamicRoute<{ name: string }>(
  '/docs/editor/:name',
  ({ name }) => `/docs/editor/${name}`,
);

/** The editor zone's sitemap, which this app's sitemap index names. */
export const editorSitemapRoute = createStaticRoute('/docs/editor/sitemap.xml', () => '/docs/editor/sitemap.xml');

/** The editor pages' index for a language model, which this app's `llms.txt` links. */
export const editorLlmsRoute = createStaticRoute('/docs/editor/llms.txt', () => '/docs/editor/llms.txt');

/** The editor zone's search, which the site's search asks beside this app's own. */
export const editorSearchRoute = createStaticRoute('/docs/editor/api/search', () => '/docs/editor/api/search');
