import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { editorExampleViewRoute } from '@zeroxsolutions/editor-docs-web/routes';
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

/** Every editor demo, which a preview opens full page. */
const demos = exampleDemos({ editor: true });

export function generateStaticParams(): { name: string }[] {
  return demos.map((name) => ({ name }));
}

export async function generateMetadata({ params }: ViewPageProps): Promise<Metadata> {
  const { name } = await params;
  if (!demos.includes(name)) notFound();
  return demoMetadata(name);
}

/**
 * A demo's page is titled and described as the docs page that previews it, and points search engines at that
 * page; a demo no page previews keeps its own name.
 */
async function demoMetadata(name: string): Promise<Metadata> {
  const docs = await pagePreviewing(source.getPages(), name);
  if (!docs) return { title: name, robots: { index: false } };
  return {
    title: `${docs.data.title} demo`,
    description: docs.data.description,
    alternates: { canonical: docs.url },
    robots: { index: false },
  };
}

export default async function Page({ params }: ViewPageProps): Promise<ReactNode> {
  const { name } = await params;
  return <ExampleView name={name} href={editorExampleViewRoute.build({ name })} />;
}
