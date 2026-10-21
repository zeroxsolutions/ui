import type { ReactNode } from 'react';

import { DocsColumns } from '@/components/layout/docs-columns';
import { nativePageTree } from '@/lib/native-source';

import { NativeDocsSidebar } from '../_components/navigation/native-docs-sidebar';

/** The native sidebar beside each native docs page. */
export default function NativeDocsLayout({ children }: { children: ReactNode }): ReactNode {
  const trees = { nativewind: nativePageTree('nativewind'), uniwind: nativePageTree('uniwind') };
  return <DocsColumns sidebar={<NativeDocsSidebar trees={trees} />}>{children}</DocsColumns>;
}
