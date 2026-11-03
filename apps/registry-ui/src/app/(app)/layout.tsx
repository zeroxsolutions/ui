import type { Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';

import { SiteFooter } from '@zeroxsolutions/ui/site/components/layout/site-footer';
import { SiteHeader } from '@zeroxsolutions/ui/site/components/layout/site-header';

import { source } from '@/lib/source';
import { PlatformNavProvider } from '@/providers/platform-nav-provider';

// The header shows a native tree only on a native page, and this app serves none.
const NO_NATIVE_TREE: Root = { name: 'Native', children: [] };

export default function AppLayout({ children }: { children: ReactNode }): ReactNode {
  const trees = { web: source.pageTree, native: { nativewind: NO_NATIVE_TREE, uniwind: NO_NATIVE_TREE } };

  return (
    <PlatformNavProvider>
      <div data-slot="layout" className="group/layout bg-background relative z-10 flex min-h-svh flex-col">
        <SiteHeader nav={{ trees, searchApi: '/api/search' }} />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        <SiteFooter />
      </div>
    </PlatformNavProvider>
  );
}
