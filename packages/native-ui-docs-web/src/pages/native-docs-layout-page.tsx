import type { Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';

import { DocsColumns } from '@zeroxsolutions/ui/site/components/layout/docs-columns';
import type { NativeEngine } from '@zeroxsolutions/ui/site/types/native-engine';

import { NativeDocsSidebar } from '../components/navigation/native-docs-sidebar';

interface NativeDocsLayoutPageProps {
  /** The native tree under each engine; the sidebar lists the one the reader last read. */
  trees: Record<NativeEngine, Root>;
  /** The docs page beside the sidebar. */
  children: ReactNode;
}

/** The native sidebar beside each native docs page. */
function NativeDocsLayoutPage({ trees, children }: NativeDocsLayoutPageProps): ReactNode {
  return <DocsColumns sidebar={<NativeDocsSidebar trees={trees} />}>{children}</DocsColumns>;
}

export { NativeDocsLayoutPage };
