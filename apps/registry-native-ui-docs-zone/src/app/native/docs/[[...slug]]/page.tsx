import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { NativeDocsPage } from '@zeroxsolutions/native-ui-docs-web/pages/native-docs-page';
import { DEFAULT_NATIVE_ENGINE } from '@zeroxsolutions/ui/site/constants/native-engines';
import { nativePageMarkdownByStyle } from '@/lib/native-page-markdown';
import { nativeDocsSource, nativePageImage, nativePageTree } from '@/lib/native-source';
import { nativeMdxComponents } from '@/mdx-components';

export const revalidate = false;
export const dynamic = 'force-static';
// No `dynamicParams = false`: Next answers a path outside the generated set with the root's not-found,
// and a slug only the web has should reach this section's, which lists the docs pages.

interface NativeDocsRouteProps {
  params: Promise<{ slug?: string[] }>;
}

export function generateStaticParams(): { slug: string[] }[] {
  return nativeDocsSource.generateParams();
}

export async function generateMetadata({ params }: NativeDocsRouteProps): Promise<Metadata> {
  const page = nativeDocsSource.getPage((await params).slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: { images: nativePageImage('docs', page.slugs).url },
  };
}

export default async function Page({ params }: NativeDocsRouteProps): Promise<ReactNode> {
  const page = nativeDocsSource.getPage((await params).slug);
  if (!page) notFound();

  const { body: Body, toc } = await page.data.load();

  return (
    <NativeDocsPage
      page={page}
      markdown={await nativePageMarkdownByStyle(page)}
      tree={nativePageTree(DEFAULT_NATIVE_ENGINE)}
      toc={toc}
    >
      <Body components={nativeMdxComponents()} />
    </NativeDocsPage>
  );
}
