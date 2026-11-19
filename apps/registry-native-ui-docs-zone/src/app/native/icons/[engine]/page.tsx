import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { NativeIconsPage } from '@zeroxsolutions/native-ui-docs-web/pages/native-icons-page';
import { NATIVE_ENGINES } from '@zeroxsolutions/ui/site/constants/native-engines';

// The gallery reads the search from the URL once it has hydrated, with no Suspense boundary to fall back to.
export const dynamic = 'force-static';

// An engine outside the set answers 404.
export const dynamicParams = false;

export function generateStaticParams(): { engine: string }[] {
  return NATIVE_ENGINES.map((engine) => ({ engine }));
}

export const metadata: Metadata = {
  title: 'Native icons',
  description: 'Every animated icon the registry publishes for React Native, with the line that installs it.',
};

interface NativeIconsRouteProps {
  params: Promise<{ engine: string }>;
}

export default async function Page({ params }: NativeIconsRouteProps): Promise<ReactNode> {
  const { engine: segment } = await params;
  const engine = NATIVE_ENGINES.find((known) => known === segment);
  if (!engine) notFound();
  return <NativeIconsPage engine={engine} />;
}
