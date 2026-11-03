import type { Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';

import { DocsColumns } from '@zeroxsolutions/ui/site/components/layout/docs-columns';
import { DocsSidebar } from '@zeroxsolutions/ui/site/components/navigation/docs-sidebar';

interface NativeComponentsLayoutPageProps {
  /** The native tree under the page's engine, which the sidebar lists. */
  tree: Root;
  /** The component page beside the sidebar. */
  children: ReactNode;
}

/** The native sidebar beside each component page, its component links under the page's engine. */
function NativeComponentsLayoutPage({ tree, children }: NativeComponentsLayoutPageProps): ReactNode {
  return <DocsColumns sidebar={<DocsSidebar tree={tree} />}>{children}</DocsColumns>;
}

export { NativeComponentsLayoutPage };
