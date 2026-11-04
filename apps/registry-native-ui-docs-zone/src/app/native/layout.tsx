import type { ReactNode } from 'react';

import { SiteFooter } from '@zeroxsolutions/ui/site/components/layout/site-footer';
import { SiteHeader } from '@zeroxsolutions/ui/site/components/layout/site-header';

import { nativePageTree } from '@/lib/native-source';
import { NativeNavProvider } from '@/providers/native-nav-provider';

export default function NativeLayout({ children }: { children: ReactNode }): ReactNode {
  const trees = {
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
