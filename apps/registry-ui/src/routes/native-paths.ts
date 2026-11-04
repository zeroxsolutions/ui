import { createDynamicRoute, createStaticRoute } from '@zeroxsolutions/routing';

import type { NativeEngine } from '@zeroxsolutions/ui/site/types/native-engine';

/**
 * The native paths this app links to, which the native zone answers on the same host. This app may not
 * import `@zeroxsolutions/native-ui-docs-web`, so they are written again here, with the values of its
 * `routes`; a link built from them is a plain anchor, since this app has no page at any of them.
 */

/** The native registry's home page. */
export const nativeHomeRoute = createStaticRoute('/native', () => '/native');

/** The native docs' introduction. */
export const nativeDocsRoute = createStaticRoute('/native/docs', () => '/native/docs');

/** One native docs page by its slug, its segments joined with `/`. */
export const nativeDocsPageRoute = createDynamicRoute<{ slug: string }>(
  '/native/docs/*slug',
  ({ slug }) => `/native/docs/${slug}`,
);

/** The native components on one engine. */
export const nativeComponentsRoute = createDynamicRoute<{ engine: NativeEngine }>(
  '/native/components/:engine',
  ({ engine }) => `/native/components/${engine}`,
);

/** One native component's page on one engine; `name` is its registry item's name. */
export const nativeComponentRoute = createDynamicRoute<{ engine: NativeEngine; name: string }>(
  '/native/components/:engine/:name',
  ({ engine, name }) => `/native/components/${engine}/${name}`,
);

/** The native blocks on one engine. */
export const nativeBlocksRoute = createDynamicRoute<{ engine: NativeEngine }>(
  '/native/blocks/:engine',
  ({ engine }) => `/native/blocks/${engine}`,
);

/** The native zone's sitemap, which this app's sitemap index names. */
export const nativeSitemapRoute = createStaticRoute('/native/sitemap.xml', () => '/native/sitemap.xml');

/** The native pages' index for a language model, which this app's `llms.txt` links. */
export const nativeLlmsRoute = createStaticRoute('/native/llms.txt', () => '/native/llms.txt');
