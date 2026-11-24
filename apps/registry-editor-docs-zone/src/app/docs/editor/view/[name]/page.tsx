import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { ExampleView } from '@zeroxsolutions/ui/site/components/layout/example-view';
import { exampleDemos } from '@zeroxsolutions/ui/site/lib/example-demos';

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
  return { title: name, robots: { index: false } };
}

export default async function Page({ params }: ViewPageProps): Promise<ReactNode> {
  return <ExampleView name={(await params).name} />;
}
