import { createDynamicRoute, createStaticRoute } from '@zeroxsolutions/routing';

/** The registry's home page. */
export const homeRoute = createStaticRoute('/', () => '/');

/** The docs; the content loader serves every page beneath this path. */
export const docsRoute = createStaticRoute('/docs', () => '/docs');

/** Every block the registry publishes, each in a frame. */
export const blocksRoute = createStaticRoute('/blocks', () => '/blocks');

/** One block alone on a page, which the docs and the blocks page frame. */
export const viewRoute = createDynamicRoute<{ name: string }>('/view/:name', ({ name }) => `/view/${name}`);

/** A docs page's share image, which `/og/docs/[...slug]` draws once at build. `slug` is its segments joined. */
export const docsShareImageRoute = createDynamicRoute<{ slug: string }>(
  '/og/docs/*slug',
  ({ slug }) => `/og/docs/${slug}`,
);
