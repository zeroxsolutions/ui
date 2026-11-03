import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { publishedBlocks } from '@zeroxsolutions/ui-docs-web/lib/published-items';
import { ViewPage } from '@zeroxsolutions/ui-docs-web/pages/view-page';

export const revalidate = false;
export const dynamic = 'force-static';
export const dynamicParams = false;

interface ViewPageProps {
  params: Promise<{ name: string }>;
}

export function generateStaticParams(): { name: string }[] {
  return publishedBlocks.map(({ name }) => ({ name }));
}

export async function generateMetadata({ params }: ViewPageProps): Promise<Metadata> {
  const { name } = await params;
  const block = publishedBlocks.find((item) => item.name === name);
  if (!block) notFound();

  return { title: block.title, description: block.description };
}

export default async function Page({ params }: ViewPageProps): Promise<ReactNode> {
  return <ViewPage name={(await params).name} />;
}
