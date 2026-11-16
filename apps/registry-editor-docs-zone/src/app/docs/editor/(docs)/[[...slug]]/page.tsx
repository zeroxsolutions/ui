import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { DocsArticle } from '@zeroxsolutions/ui/site/components/layout/docs-article';

import { docsLlms, docsPageImage, editorPage, sidebarTree, source } from '@/lib/source';
import { mdxComponents } from '@/mdx-components';

export const revalidate = false;
export const dynamic = 'force-static';

interface EditorDocsPageProps {
  params: Promise<{ slug?: string[] }>;
}

export function generateStaticParams(): { slug: string[] }[] {
  return source.getPages().map((page) => ({ slug: page.slugs.slice(1) }));
}

export async function generateMetadata({ params }: EditorDocsPageProps): Promise<Metadata> {
  const page = editorPage((await params).slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: { images: docsPageImage(page).url },
  };
}

export default async function Page({ params }: EditorDocsPageProps): Promise<ReactNode> {
  const page = editorPage((await params).slug);
  if (!page) notFound();

  const { body: Body, toc } = await page.data.load();

  return (
    <DocsArticle
      title={page.data.title}
      description={page.data.description}
      markdown={await docsLlms.page(page)}
      tree={sidebarTree()}
      url={page.url}
      toc={toc}
    >
      <Body components={mdxComponents} />
    </DocsArticle>
  );
}
