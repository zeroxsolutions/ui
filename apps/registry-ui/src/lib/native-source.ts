import { nativeComponents, nativeDocs } from 'collections/server';
import type { Root } from 'fumadocs-core/page-tree';
import { llms, loader } from 'fumadocs-core/source';

import { DEFAULT_NATIVE_ENGINE } from '@/constants/native-engines';
import { pageMarkdown } from '@/lib/source';
import { nativeComponentsRoute, nativeDocsRoute, nativeShareImageRoute } from '@/routes/app-routes';
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

/**
 * The native component pages under the default engine, the URLs search engines, the sitemap, search and
 * `llms.txt` list. A page under another engine is the same MDX with other install commands, and names its
 * twin here as canonical.
 */
export const canonicalNativeComponentsSource = nativeComponentsSources[DEFAULT_NATIVE_ENGINE];

/** The canonical URL of the native component page at `slugs`, under the default engine, whichever engine a reader is on. */
export function canonicalNativeComponentUrl(slugs: string[]): string {
  const page = canonicalNativeComponentsSource.getPage(slugs);
  if (!page) throw new Error(`canonicalNativeComponentUrl: no native component page at "${slugs.join('/')}"`);
  return page.url;
}

/**
 * The address of a native page's share image, which `/og/native/[...slug]` draws at build, and its
 * segments there: `docs/<slug>` or `components/<name>`, the same for every engine.
 */
export function nativePageImage(section: 'docs' | 'components', slugs: string[]): { segments: string[]; url: string } {
  const segments = [section, ...slugs, 'image.png'];
  return { segments, url: nativeShareImageRoute.build({ slug: segments.join('/') }) };
}

/** The native docs as Markdown for a language model, as `docsLlms` is for the web docs. */
export const nativeDocsLlms = llms(nativeDocsSource, { renderPage: pageMarkdown });

/** The native component pages as Markdown for a language model, at their canonical URLs. */
export const nativeComponentsLlms = llms(canonicalNativeComponentsSource, { renderPage: pageMarkdown });
