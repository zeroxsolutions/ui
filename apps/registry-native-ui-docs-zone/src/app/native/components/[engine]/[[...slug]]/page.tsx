import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { NativeComponentPage } from '@zeroxsolutions/native-ui-docs-web/pages/native-component-page';
import { NATIVE_ENGINES } from '@zeroxsolutions/ui/site/constants/native-engines';
import {
  canonicalNativeComponentUrl,
  nativeComponentsSources,
  nativePageImage,
  nativePageTree,
} from '@/lib/native-source';
import { nativePageMarkdownByStyle } from '@/lib/native-page-markdown';
import { nativeMdxComponents } from '@/mdx-components';

export const revalidate = false;
export const dynamic = 'force-static';

// No `dynamicParams = false`: Next answers a path outside the generated set with the root's not-found,
// and a slug only the web has should reach this section's, which lists the components. An engine outside
// the set still answers 404, from the layout and from `componentPage`.

interface NativeComponentRouteProps {
  params: Promise<{ engine: string; slug?: string[] }>;
}

export function generateStaticParams(): { engine: string; slug: string[] }[] {
  return NATIVE_ENGINES.flatMap((engine) =>
    nativeComponentsSources[engine].generateParams().map(({ slug }) => ({ engine, slug })),
  );
}

async function componentPage(params: NativeComponentRouteProps['params']) {
  const { engine: segment, slug } = await params;
  const engine = NATIVE_ENGINES.find((known) => known === segment);
  const page = engine && nativeComponentsSources[engine].getPage(slug);
  if (!engine || !page) notFound();
  return { engine, page };
}

export async function generateMetadata({ params }: NativeComponentRouteProps): Promise<Metadata> {
  const { page } = await componentPage(params);
  return {
    title: page.data.title,
    description: page.data.description,
    // Every engine's page of one component is one page to a search engine, listed under the default engine.
    alternates: { canonical: canonicalNativeComponentUrl(page.slugs) },
    openGraph: { images: nativePageImage('components', page.slugs).url },
  };
}

export default async function Page({ params }: NativeComponentRouteProps): Promise<ReactNode> {
  const { engine, page } = await componentPage(params);
  const { body: Body, toc } = await page.data.load();

  return (
    <NativeComponentPage
      page={page}
      markdown={await nativePageMarkdownByStyle(page, engine)}
      tree={nativePageTree(engine)}
      toc={toc}
    >
      <Body components={nativeMdxComponents(engine)} />
    </NativeComponentPage>
  );
}
