import { createDynamicRoute, createStaticRoute } from '@zeroxsolutions/routing';

import type { NativeEngine } from '@zeroxsolutions/ui/site/types/native-engine';

/** The native registry's home page, the native counterpart of `homeRoute`. */
export const nativeHomeRoute = createStaticRoute('/native', () => '/native');

/** The native docs' introduction; the native docs loader serves every page beneath this path. */
export const nativeDocsRoute = createStaticRoute('/native/docs', () => '/native/docs');

/** One native docs page by its slug, its segments joined with `/` (`installation`). */
export const nativeDocsPageRoute = createDynamicRoute<{ slug: string }>(
  '/native/docs/*slug',
  ({ slug }) => `/native/docs/${slug}`,
);

/** The native components on one engine, which the native components loader serves from `content/native/components`. */
export const nativeComponentsRoute = createDynamicRoute<{ engine: NativeEngine }>(
  '/native/components/:engine',
  ({ engine }) => `/native/components/${engine}`,
);

/** One native component's page on one engine; `name` is its registry item's name, the same on every engine. */
export const nativeComponentRoute = createDynamicRoute<{ engine: NativeEngine; name: string }>(
  '/native/components/:engine/:name',
  ({ engine, name }) => `/native/components/${engine}/${name}`,
);

/** The native blocks on one engine, each drawn by the engine's preview app. */
export const nativeBlocksRoute = createDynamicRoute<{ engine: NativeEngine }>(
  '/native/blocks/:engine',
  ({ engine }) => `/native/blocks/${engine}`,
);

/**
 * A native page's share image, which `/og/native/[...slug]` draws once at build. `slug` is `docs/<page>` or
 * `components/<name>`, with no engine: both engines' pages of one component share the image.
 */
export const nativeShareImageRoute = createDynamicRoute<{ slug: string }>(
  '/og/native/*slug',
  ({ slug }) => `/og/native/${slug}`,
);
