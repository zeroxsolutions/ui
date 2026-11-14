import type { ReactNode } from 'react';

import { DocsColumns } from '@zeroxsolutions/ui/site/components/layout/docs-columns';
import { SiteFooter } from '@zeroxsolutions/ui/site/components/layout/site-footer';
import { SiteHeader } from '@zeroxsolutions/ui/site/components/layout/site-header';
import { DocsSidebar } from '@zeroxsolutions/ui/site/components/navigation/docs-sidebar';

import { sidebarTree } from '@/lib/source';
import { EditorNavProvider } from '@/providers/editor-nav-provider';

export default function EditorDocsLayout({ children }: { children: ReactNode }): ReactNode {
  const tree = sidebarTree();

  return (
    <EditorNavProvider>
      <div data-slot="layout" className="group/layout bg-background relative z-10 flex min-h-svh flex-col">
        <SiteHeader nav={{ trees: { web: tree }, searchApi: '/docs/editor/api/search' }} />
        <main className="flex min-h-0 flex-1 flex-col">
          <DocsColumns sidebar={<DocsSidebar tree={tree} />}>{children}</DocsColumns>
        </main>
        <SiteFooter />
      </div>
    </EditorNavProvider>
  );
}
