import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { CopyPageButton } from '@/components/data-display/copy-page-button';
import { DocsNeighbourLink } from '@/components/navigation/docs-neighbour-link';
import { DocsPager } from '@/components/navigation/docs-pager';
import { DocsToc } from '@/components/navigation/docs-toc';
import { pageNeighbours } from '@/lib/page-tree';
import { docsPageImage, source } from '@/lib/source';
import { mdxComponents } from '@/mdx-components';
import { ScrollArea } from '@/registry/bases/base-ui/ui/scroll-area';

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
  const neighbours = pageNeighbours(source.pageTree, page.url);

  return (
    <div data-slot="docs" className="flex scroll-mt-24 items-stretch pb-8 text-[1.05rem] sm:text-[15px] xl:w-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-(--top-spacing) shrink-0" />
        <div className="text-foreground dark:text-foreground mx-auto flex w-full max-w-160 min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-0 lg:py-8">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between md:items-start">
                <h1 className="scroll-m-24 text-3xl font-semibold tracking-tight sm:text-3xl">{page.data.title}</h1>
                <div className="docs-nav flex items-center gap-2">
                  <div className="hidden sm:block">
                    <CopyPageButton url={page.url} />
                  </div>
                  <div className="ml-auto flex gap-2">
                    {neighbours.previous && <DocsNeighbourLink direction="previous" href={neighbours.previous.url} />}
                    {neighbours.next && <DocsNeighbourLink direction="next" href={neighbours.next.url} />}
                  </div>
                </div>
              </div>
              {page.data.description && (
                <p className="text-muted-foreground text-[1.05rem] sm:text-base sm:text-balance md:max-w-[80%]">
                  {page.data.description}
                </p>
              )}
            </div>
          </div>
          <div className="typeset w-full flex-1 pb-16 *:data-[slot=alert]:first:mt-0 sm:pb-0">
            <Body components={mdxComponents} />
          </div>
          <DocsPager tree={source.pageTree} url={page.url} />
        </div>
      </div>
      {/* A landmark only when it lists something: a page without headings leaves the column empty.
          Beyond upstream's 90svh, the column is as tall as the viewport under the header less this
          page's bottom padding, so at the page's end it still fits and is not pushed up as it sticks. */}
      <div
        role={page.data.toc.length ? 'navigation' : undefined}
        aria-label={page.data.toc.length ? 'On this page' : undefined}
        className="sticky top-[calc(var(--header-height)+1px)] z-30 ml-auto hidden h-[calc(100svh-var(--header-height)-1px-var(--spacing)*8)] w-(--sidebar-width) flex-col gap-4 overflow-hidden overscroll-none pb-8 xl:flex"
      >
        <div className="h-(--top-spacing) shrink-0" />
        {/* A ScrollArea where upstream's list scrolls itself, its viewport carrying upstream's fade. Its
            overscroll is none, beyond upstream: WebKit chains a wheel past its end into the page otherwise. */}
        {page.data.toc.length ? (
          <ScrollArea className="**:data-[slot=scroll-area-viewport]:scroll-fade min-h-0 **:data-[slot=scroll-area-viewport]:overscroll-none">
            <div className="flex flex-col gap-8 px-8">
              <DocsToc toc={page.data.toc} />
            </div>
          </ScrollArea>
        ) : null}
      </div>
    </div>
  );
}
