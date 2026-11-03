import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { NativeComponentsLayoutPage } from '@zeroxsolutions/native-ui-docs-web/pages/native-components-layout-page';
import { NATIVE_ENGINES } from '@zeroxsolutions/ui/site/constants/native-engines';
import { nativePageTree } from '@/lib/native-source';

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

  return <NativeComponentsLayoutPage tree={nativePageTree(engine)}>{children}</NativeComponentsLayoutPage>;
}
