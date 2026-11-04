import { createDynamicRoute, createStaticRoute } from '@zeroxsolutions/routing';

import type { ComponentBase } from '@zeroxsolutions/ui/site/types/component-base';

/**
 * The web paths this zone links to, which registry-ui answers on the same host. This zone may not import
 * `@zeroxsolutions/ui-docs-web`, so they are written again here, with the values of its `routes`; a
 * link built from them is a plain anchor, since this app has no page at any of them.
 */

/** The registry's home page. */
export const webHomeRoute = createStaticRoute('/', () => '/');

/** The web docs' introduction. */
export const webDocsRoute = createStaticRoute('/docs', () => '/docs');

/** One web docs page by its slug, its segments joined with `/`. */
export const webDocsPageRoute = createDynamicRoute<{ slug: string }>('/docs/*slug', ({ slug }) => `/docs/${slug}`);

/** The web components on one base. */
export const webComponentsRoute = createDynamicRoute<{ base: ComponentBase }>(
  '/docs/components/:base',
  ({ base }) => `/docs/components/${base}`,
);

/** One web component's docs page on one base; `name` is its registry item's name. */
export const webComponentRoute = createDynamicRoute<{ base: ComponentBase; name: string }>(
  '/docs/components/:base/:name',
  ({ base, name }) => `/docs/components/${base}/${name}`,
);

/** Every web block on one base. */
export const webBlocksRoute = createDynamicRoute<{ base: ComponentBase }>(
  '/blocks/:base',
  ({ base }) => `/blocks/${base}`,
);
