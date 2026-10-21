import { nativeComponents, nativeDocs } from 'collections/server';
import type { Root } from 'fumadocs-core/page-tree';
import { loader } from 'fumadocs-core/source';

import { DEFAULT_NATIVE_ENGINE } from '@/constants/native-engines';
import { nativeComponentsRoute, nativeDocsRoute } from '@/routes/app-routes';
import type { NativeEngine } from '@/types/native-engine';

/** The native docs pages, `content/native/docs`, under `/native/docs`. */
export const nativeDocsSource = loader({
  baseUrl: nativeDocsRoute.build(),
  source: nativeDocs.toFumadocsSource(),
});

const nativeComponentsSource = nativeComponents.toFumadocsSource();

/**
 * The native component pages, `content/native/components`, once per engine: the same pages, each
 * loader putting their URLs under its own `/native/components/<engine>`. An engine added to
 * `NATIVE_ENGINES` fails the `satisfies` until it has its loader here.
 */
export const nativeComponentsSources = {
  nativewind: loader({
    baseUrl: nativeComponentsRoute.build({ engine: 'nativewind' }),
    source: nativeComponentsSource,
  }),
  uniwind: loader({ baseUrl: nativeComponentsRoute.build({ engine: 'uniwind' }), source: nativeComponentsSource }),
} satisfies Record<NativeEngine, unknown>;

/** The native sidebar under `engine`: the docs pages, then the component pages with their links on that engine. */
export function nativePageTree(engine: NativeEngine): Root {
  return {
    name: 'Native',
    children: [...nativeDocsSource.pageTree.children, ...nativeComponentsSources[engine].pageTree.children],
  };
}

/** Every native component's name, the slug its page has under every engine; the components index is not one. */
export function nativeComponentNames(): string[] {
  return nativeComponentsSources[DEFAULT_NATIVE_ENGINE]
    .getPages()
    .filter((page) => page.slugs.length > 0)
    .map((page) => page.slugs.join('/'));
}
