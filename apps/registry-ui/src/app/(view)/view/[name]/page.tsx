import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { ComponentPreviewDemo } from '@/components/data-display/component-preview-demo';
import { publishedBlocks } from '@/lib/registry';

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

/** One block alone, with no site chrome, as the frames on the docs and the blocks page show it. */
export default async function ViewPage({ params }: ViewPageProps): Promise<ReactNode> {
  const { name } = await params;

  return (
    <main className="p-6">
      <ComponentPreviewDemo name={name} />
    </main>
  );
}
