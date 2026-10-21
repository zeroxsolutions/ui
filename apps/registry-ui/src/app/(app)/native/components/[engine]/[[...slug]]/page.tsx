import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { DocsArticle } from '@/components/layout/docs-article';
import { EngineSwitcher } from '@/components/navigation/engine-switcher';
import { NATIVE_ENGINES } from '@/constants/native-engines';
import { DEFAULT_PLATFORM_STYLE } from '@/constants/platform-styles';
import {
  canonicalNativeComponentUrl,
  nativeComponentsSources,
  nativePageImage,
  nativePageTree,
} from '@/lib/native-source';
import { nativePageMarkdown } from '@/lib/native-page-markdown';
import { nativeMdxComponents } from '@/mdx-components';

export const revalidate = false;
export const dynamic = 'force-static';

// An engine outside the set answers 404 rather than a page whose snippets name an engine nobody publishes.
export const dynamicParams = false;

interface NativeComponentPageProps {
  params: Promise<{ engine: string; slug?: string[] }>;
}

export function generateStaticParams(): { engine: string; slug: string[] }[] {
  return NATIVE_ENGINES.flatMap((engine) =>
    nativeComponentsSources[engine].generateParams().map(({ slug }) => ({ engine, slug })),
  );
}

async function componentPage(params: NativeComponentPageProps['params']) {
  const { engine: segment, slug } = await params;
  const engine = NATIVE_ENGINES.find((known) => known === segment);
  const page = engine && nativeComponentsSources[engine].getPage(slug);
  if (!engine || !page) notFound();
  return { engine, page };
}

export async function generateMetadata({ params }: NativeComponentPageProps): Promise<Metadata> {
  const { page } = await componentPage(params);
  return {
    title: page.data.title,
    description: page.data.description,
    // Every engine's page of one component is one page to a search engine, listed under the default engine.
    alternates: { canonical: canonicalNativeComponentUrl(page.slugs) },
    openGraph: { images: nativePageImage('components', page.slugs).url },
  };
}

export default async function NativeComponentPage({ params }: NativeComponentPageProps): Promise<ReactNode> {
  const { engine, page } = await componentPage(params);
  const Body = page.data.body;

  return (
    <DocsArticle
      title={page.data.title}
      description={page.data.description}
      tabs={<EngineSwitcher />}
      markdown={await nativePageMarkdown(page, { engine, style: DEFAULT_PLATFORM_STYLE.native })}
      tree={nativePageTree(engine)}
      url={page.url}
      toc={page.data.toc}
    >
      <Body components={nativeMdxComponents(engine)} />
    </DocsArticle>
  );
}
