import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { DocsNeighbourLink } from '@/components/navigation/docs-neighbour-link';
import { DocsPager } from '@/components/navigation/docs-pager';
import { DocsToc } from '@/components/navigation/docs-toc';
import { pageNeighbours } from '@/lib/page-tree';
import { docsLlms, docsPageImage, source } from '@/lib/source';
import { mdxComponents } from '@/mdx-components';
import { CopyButton } from '@/registry/bases/base-ui/components/feedback/copy-button';
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
  // What the page's `.md` URL serves, so a copy and a fetch of that URL give the same text.
  const markdown = await docsLlms.page(page);
  const toc = page.data.toc;

  return (
    <div data-slot="docs" className="flex scroll-mt-24 items-stretch xl:w-full">
      <div className="mx-auto flex w-full max-w-160 min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-0 lg:py-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <h1 className="scroll-m-24 text-3xl font-semibold tracking-tight">{page.data.title}</h1>
            <div className="flex items-center gap-2">
              <CopyButton value={markdown} label="Copy page" variant="secondary" size="icon-sm" />
              {neighbours.previous && <DocsNeighbourLink direction="previous" href={neighbours.previous.url} />}
              {neighbours.next && <DocsNeighbourLink direction="next" href={neighbours.next.url} />}
            </div>
          </div>
          {page.data.description && <p className="text-muted-foreground text-balance">{page.data.description}</p>}
        </div>
        <div className="typeset w-full flex-1 *:data-[slot=alert]:first:mt-0">
          <Body components={mdxComponents} />
        </div>
        <DocsPager tree={source.pageTree} url={page.url} />
      </div>
      {/* A landmark only when it lists something: a page without headings leaves the column empty. */}
      <div
        role={toc.length ? 'navigation' : undefined}
        aria-label={toc.length ? 'On this page' : undefined}
        className="sticky top-(--header-height) z-30 hidden h-[calc(100svh-var(--header-height))] w-(--sidebar-width) shrink-0 flex-col overflow-hidden py-6 lg:py-8 xl:flex"
      >
        {toc.length ? (
          <ScrollArea className="min-h-0 **:data-[slot=scroll-area-viewport]:overscroll-none">
            <DocsToc toc={toc} />
          </ScrollArea>
        ) : null}
      </div>
    </div>
  );
}
