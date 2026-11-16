import type { ReactNode } from 'react';

import { DocsLayoutPage } from '@zeroxsolutions/ui-docs-web/pages/docs-layout-page';
import { docsTree } from '@/lib/docs-tree';

export default function DocsLayout({ children }: { children: ReactNode }): ReactNode {
  return <DocsLayoutPage tree={docsTree}>{children}</DocsLayoutPage>;
}
