import { createDynamicRoute, createStaticRoute } from '@zeroxsolutions/routing';

import type { ComponentBase } from '@/types/component-base';

/** The registry's home page. */
export const homeRoute = createStaticRoute('/', () => '/');

/** The docs; the content loader serves every page beneath this path. */
export const docsRoute = createStaticRoute('/docs', () => '/docs');

/** The docs' index of the components on one base, which the docs serve from `content/docs/components/<base>`. */
export const componentsRoute = createDynamicRoute<{ base: ComponentBase }>(
  '/docs/components/:base',
  ({ base }) => `/docs/components/${base}`,
);

/** One component's docs page on one base; `name` is its registry item's name. */
export const componentRoute = createDynamicRoute<{ base: ComponentBase; name: string }>(
  '/docs/components/:base/:name',
  ({ base, name }) => `/docs/components/${base}/${name}`,
);

/** Every block the registry publishes on one base, each in a frame. */
export const blocksRoute = createDynamicRoute<{ base: ComponentBase }>(
  '/blocks/:base',
  ({ base }) => `/blocks/${base}`,
);

/** One block alone on a page, which the docs and the blocks page frame. */
export const viewRoute = createDynamicRoute<{ name: string }>('/view/:name', ({ name }) => `/view/${name}`);

/** A docs page's share image, which `/og/docs/[...slug]` draws once at build. `slug` is its segments joined. */
export const docsShareImageRoute = createDynamicRoute<{ slug: string }>(
  '/og/docs/*slug',
  ({ slug }) => `/og/docs/${slug}`,
);
