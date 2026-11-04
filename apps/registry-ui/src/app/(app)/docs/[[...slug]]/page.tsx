import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { DocsPage } from '@zeroxsolutions/ui-docs-web/pages/docs-page';
import { docsLlms, docsPageImage, source } from '@/lib/source';
import { mdxComponents } from '@/mdx-components';

export const revalidate = false;
export const dynamic = 'force-static';
// No `dynamicParams = false`: Next answers a path outside the generated set with the root's not-found,
// and a slug only the native docs have should reach this section's, which lists the docs or the components.

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

export default async function Page({ params }: DocsPageProps): Promise<ReactNode> {
  const page = source.getPage((await params).slug);
  if (!page) notFound();

  const { body: Body, toc } = await page.data.load();

  return (
    <DocsPage page={page} markdown={await docsLlms.page(page)} tree={source.pageTree} toc={toc}>
      <Body components={mdxComponents} />
    </DocsPage>
  );
}
