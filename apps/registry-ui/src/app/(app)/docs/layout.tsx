import type { ReactNode } from 'react';

import { DocsLayoutPage } from '@zeroxsolutions/ui-docs-web/pages/docs-layout-page';
import { publishedItems } from '@zeroxsolutions/ui-docs-web/lib/published-items';
import { withEditorSection } from '@/lib/editor-nav';
import { source } from '@/lib/source';

export default function DocsLayout({ children }: { children: ReactNode }): ReactNode {
  return <DocsLayoutPage tree={withEditorSection(source.pageTree, publishedItems)}>{children}</DocsLayoutPage>;
}
