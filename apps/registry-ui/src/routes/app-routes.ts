import { createDynamicRoute, createStaticRoute } from '@zeroxsolutions/routing';

import type { ComponentBase } from '@/types/component-base';
import type { NativeEngine } from '@/types/native-engine';

/** The registry's home page. */
export const homeRoute = createStaticRoute('/', () => '/');

/** The docs; the content loader serves every page beneath this path. */
export const docsRoute = createStaticRoute('/docs', () => '/docs');

/** One web docs page by its slug, its segments joined with `/` (`installation`, `blocks/ai-provider-picker`). */
export const docsPageRoute = createDynamicRoute<{ slug: string }>('/docs/*slug', ({ slug }) => `/docs/${slug}`);

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

/** The native blocks on one engine; an empty state until the registry publishes a native block. */
export const nativeBlocksRoute = createDynamicRoute<{ engine: NativeEngine }>(
  '/native/blocks/:engine',
  ({ engine }) => `/native/blocks/${engine}`,
);

/** One block alone on a page, which the docs and the blocks page frame. */
export const viewRoute = createDynamicRoute<{ name: string }>('/view/:name', ({ name }) => `/view/${name}`);

/** A docs page's share image, which `/og/docs/[...slug]` draws once at build. `slug` is its segments joined. */
export const docsShareImageRoute = createDynamicRoute<{ slug: string }>(
  '/og/docs/*slug',
  ({ slug }) => `/og/docs/${slug}`,
);

/**
 * A native page's share image, which `/og/native/[...slug]` draws once at build. `slug` is `docs/<page>` or
 * `components/<name>`, with no engine: both engines' pages of one component share the image.
 */
export const nativeShareImageRoute = createDynamicRoute<{ slug: string }>(
  '/og/native/*slug',
  ({ slug }) => `/og/native/${slug}`,
);
