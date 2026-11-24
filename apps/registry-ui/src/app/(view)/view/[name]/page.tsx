import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { publishedBlocks } from '@zeroxsolutions/ui-docs-web/lib/published-items';
import { docsRoute, viewRoute } from '@zeroxsolutions/ui-docs-web/routes';
import { ExampleView } from '@zeroxsolutions/ui/site/components/layout/example-view';
import { exampleDemos } from '@zeroxsolutions/ui/site/lib/example-demos';
import { pagePreviewing } from '@zeroxsolutions/ui/site/lib/page-markdown';

import { source } from '@/lib/source';

export const revalidate = false;
export const dynamic = 'force-static';
export const dynamicParams = false;

interface ViewPageProps {
  params: Promise<{ name: string }>;
}

/** Every published block, which the docs frame, and every demo this app previews, which a preview opens full page. */
const demos = exampleDemos({ editor: false });

export function generateStaticParams(): { name: string }[] {
  return [...publishedBlocks.map(({ name }) => name), ...demos].map((name) => ({ name }));
}

export async function generateMetadata({ params }: ViewPageProps): Promise<Metadata> {
  const { name } = await params;
  const block = publishedBlocks.find((item) => item.name === name);
  if (block) return { title: block.title, description: block.description };
  if (!demos.includes(name)) notFound();
  return { title: name, robots: { index: false } };
}

export default async function Page({ params }: ViewPageProps): Promise<ReactNode> {
  const { name } = await params;
  const docs = await pagePreviewing(source.getPages(), name);
  return <ExampleView name={name} href={viewRoute.build({ name })} docsHref={docs?.url ?? docsRoute.build()} />;
}
