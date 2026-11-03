import type { ReactNode } from 'react';

import { DocsLayoutPage } from '@zeroxsolutions/ui-docs-web/pages/docs-layout-page';
import { source } from '@/lib/source';

export default function DocsLayout({ children }: { children: ReactNode }): ReactNode {
  return <DocsLayoutPage tree={source.pageTree}>{children}</DocsLayoutPage>;
}
