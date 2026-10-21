import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { DocsColumns } from '@/components/layout/docs-columns';
import { DocsSidebar } from '@/components/navigation/docs-sidebar';
import { NATIVE_ENGINES } from '@/constants/native-engines';
import { nativePageTree } from '@/lib/native-source';

/** The native sidebar beside each component page, its component links under the page's engine. */
export default async function NativeComponentsLayout({
  params,
  children,
}: {
  params: Promise<{ engine: string }>;
  children: ReactNode;
}): Promise<ReactNode> {
  const { engine: segment } = await params;
  const engine = NATIVE_ENGINES.find((known) => known === segment);
  if (!engine) notFound();

  return <DocsColumns sidebar={<DocsSidebar tree={nativePageTree(engine)} />}>{children}</DocsColumns>;
}
