import type { Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';

import { SiteFooter } from '@zeroxsolutions/ui/site/components/layout/site-footer';
import { SiteHeader } from '@zeroxsolutions/ui/site/components/layout/site-header';

import { nativePageTree } from '@/lib/native-source';
import { NativeNavProvider } from '@/providers/native-nav-provider';

// The header shows the web tree only on a web page, and this zone serves none.
const NO_WEB_TREE: Root = { name: 'Docs', children: [] };

export default function NativeLayout({ children }: { children: ReactNode }): ReactNode {
  const trees = {
    web: NO_WEB_TREE,
    native: { nativewind: nativePageTree('nativewind'), uniwind: nativePageTree('uniwind') },
  };

  return (
    <NativeNavProvider>
      <div data-slot="layout" className="group/layout bg-background relative z-10 flex min-h-svh flex-col">
        <SiteHeader nav={{ trees, searchApi: '/native/api/search' }} />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        <SiteFooter />
      </div>
    </NativeNavProvider>
  );
}
