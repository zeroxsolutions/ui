import { createDynamicRoute, createStaticRoute } from '@zeroxsolutions/routing';

/** The editor docs' introduction; the editor docs loader serves every page beneath this path. */
export const editorDocsRoute = createStaticRoute('/docs/editor', () => '/docs/editor');

/** One editor docs page by its name (`document-editor`). */
export const editorDocsPageRoute = createDynamicRoute<{ name: string }>(
  '/docs/editor/:name',
  ({ name }) => `/docs/editor/${name}`,
);

/** An editor docs page's share image, which `/og/docs/editor/[...slug]` draws once at build. `slug` is its segments joined, ending in `image.png`. */
export const editorDocsShareImageRoute = createDynamicRoute<{ slug: string }>(
  '/og/docs/editor/*slug',
  ({ slug }) => `/og/docs/editor/${slug}`,
);

/** One editor demo alone, with no site chrome, which a preview's full page button opens. */
export const editorExampleViewRoute = createDynamicRoute<{ name: string }>(
  '/docs/editor/view/:name',
  ({ name }) => `/docs/editor/view/${name}`,
);
