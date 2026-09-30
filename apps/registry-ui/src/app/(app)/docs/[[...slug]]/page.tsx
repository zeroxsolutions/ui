import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { DocsPager } from '@/components/navigation/docs-pager';
import { DocsToc } from '@/components/navigation/docs-toc';
import { docsPageImage, source } from '@/lib/source';
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
    <div className="flex items-start gap-10 px-6 py-10">
      <article className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{page.data.title}</h1>
          <p className="text-muted-foreground">{page.data.description}</p>
        </header>
        <Body components={mdxComponents} />
        <DocsPager tree={source.pageTree} url={page.url} className="mt-6 border-t pt-6" />
      </article>
      <aside className="sticky top-[calc(var(--header-height)+--spacing(10))] hidden w-56 shrink-0 xl:block">
        <DocsToc toc={page.data.toc} />
      </aside>
    </div>
  );
}
