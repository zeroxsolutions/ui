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
    <div data-slot="docs" className="flex scroll-mt-24 items-stretch pb-8 text-[1.05rem] sm:text-[15px] xl:w-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-(--top-spacing) shrink-0" />
        <div className="text-foreground dark:text-foreground mx-auto flex w-full max-w-160 min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-0 lg:py-8">
          <header className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{page.data.title}</h1>
            <p className="text-muted-foreground">{page.data.description}</p>
          </header>
          <Body components={mdxComponents} />
          <DocsPager tree={source.pageTree} url={page.url} className="mt-6 border-t pt-6" />
        </div>
      </div>
      <div className="sticky top-[calc(var(--header-height)+1px)] z-30 ml-auto hidden h-[90svh] w-(--sidebar-width) flex-col gap-4 overflow-hidden overscroll-none pb-8 xl:flex">
        <div className="h-(--top-spacing) shrink-0" />
        {/* overscroll-none on the list too, beyond upstream: WebKit chains a wheel past its end into the page otherwise. */}
        {page.data.toc.length ? (
          <div className="scroll-fade flex scrollbar-none flex-col gap-8 overflow-y-auto overscroll-none px-8">
            <DocsToc toc={page.data.toc} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
