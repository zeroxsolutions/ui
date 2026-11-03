import type { Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';

import { DocsColumns } from '@zeroxsolutions/ui/site/components/layout/docs-columns';
import { DocsSidebar } from '@zeroxsolutions/ui/site/components/navigation/docs-sidebar';

interface DocsLayoutPageProps {
  /** The web docs' page tree, which the sidebar lists. */
  tree: Root;
  /** The docs page beside the sidebar. */
  children: ReactNode;
}

/** The web docs' sidebar beside each page. */
function DocsLayoutPage({ tree, children }: DocsLayoutPageProps): ReactNode {
  return <DocsColumns sidebar={<DocsSidebar tree={tree} />}>{children}</DocsColumns>;
}

export { DocsLayoutPage };
