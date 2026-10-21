import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { DocsArticle } from '@/components/layout/docs-article';
import { DEFAULT_NATIVE_ENGINE } from '@/constants/native-engines';
import { nativeDocsSource, nativePageTree } from '@/lib/native-source';
import { pageMarkdown } from '@/lib/source';
import { nativeMdxComponents } from '@/mdx-components';

export const revalidate = false;
export const dynamic = 'force-static';
export const dynamicParams = false;

interface NativeDocsPageProps {
  params: Promise<{ slug?: string[] }>;
}

export function generateStaticParams(): { slug: string[] }[] {
  return nativeDocsSource.generateParams();
}

export async function generateMetadata({ params }: NativeDocsPageProps): Promise<Metadata> {
  const page = nativeDocsSource.getPage((await params).slug);
  if (!page) notFound();

  return { title: page.data.title, description: page.data.description };
}

export default async function NativeDocsPage({ params }: NativeDocsPageProps): Promise<ReactNode> {
  const page = nativeDocsSource.getPage((await params).slug);
  if (!page) notFound();

  const Body = page.data.body;

  return (
    <DocsArticle
      title={page.data.title}
      description={page.data.description}
      markdown={await pageMarkdown(page)}
      // The pager steps on into the components under the default engine; the page itself names none.
      tree={nativePageTree(DEFAULT_NATIVE_ENGINE)}
      url={page.url}
      toc={page.data.toc}
    >
      <Body components={nativeMdxComponents()} />
    </DocsArticle>
  );
}
