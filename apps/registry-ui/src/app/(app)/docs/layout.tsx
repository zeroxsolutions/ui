import type { ReactNode } from 'react';

import { DocsColumns } from '@/components/layout/docs-columns';
import { DocsSidebar } from '@/components/navigation/docs-sidebar';
import { source } from '@/lib/source';

/** The web docs' sidebar beside each page. */
export default function DocsLayout({ children }: { children: ReactNode }): ReactNode {
  return <DocsColumns sidebar={<DocsSidebar tree={source.pageTree} />}>{children}</DocsColumns>;
}
