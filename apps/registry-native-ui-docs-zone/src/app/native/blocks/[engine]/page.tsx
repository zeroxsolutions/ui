import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { NativeBlocksPage } from '@zeroxsolutions/native-ui-docs-web/pages/native-blocks-page';
import { NATIVE_ENGINES } from '@zeroxsolutions/ui/site/constants/native-engines';

import { nativeComponentsSources } from '@/lib/native-source';

export const dynamic = 'force-static';

// An engine outside the set answers 404.
export const dynamicParams = false;

export function generateStaticParams(): { engine: string }[] {
  return NATIVE_ENGINES.map((engine) => ({ engine }));
}

export const metadata: Metadata = {
  title: 'Native blocks',
  description: 'The blocks the registry publishes for React Native, each drawn live.',
};

interface NativeBlocksRouteProps {
  params: Promise<{ engine: string }>;
}

export default async function Page({ params }: NativeBlocksRouteProps): Promise<ReactNode> {
  const { engine: segment } = await params;
  const engine = NATIVE_ENGINES.find((known) => known === segment);
  if (!engine) notFound();
  return (
    <NativeBlocksPage engine={engine} componentPage={(name) => nativeComponentsSources[engine].getPage([name])?.url} />
  );
}
