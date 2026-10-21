import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { DocsArticle } from '@/components/layout/docs-article';
import { docsLlms, docsPageImage, source } from '@/lib/source';
import { mdxComponents } from '@/mdx-components';

export const revalidate = false;
export const dynamic = 'force-static';
export const dynamicParams = false;

interface DocsPageProps {
  params: Promise<{ slug?: string[] }>;
}

export function generateStaticParams(): { slug: string[] }[] {
  return source.generateParams();
}

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const page = source.getPage((await params).slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: { images: docsPageImage(page).url },
  };
}

export default async function DocsPage({ params }: DocsPageProps): Promise<ReactNode> {
  const page = source.getPage((await params).slug);
  if (!page) notFound();

  const Body = page.data.body;

  return (
    <DocsArticle
      title={page.data.title}
      description={page.data.description}
      markdown={await docsLlms.page(page)}
      tree={source.pageTree}
      url={page.url}
      toc={page.data.toc}
    >
      <Body components={mdxComponents} />
    </DocsArticle>
  );
}
