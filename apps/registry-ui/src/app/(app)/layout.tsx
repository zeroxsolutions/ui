import type { ReactNode } from 'react';

import { SiteFooter } from '@zeroxsolutions/ui/site/components/layout/site-footer';
import { SiteHeader } from '@zeroxsolutions/ui/site/components/layout/site-header';

import { source } from '@/lib/source';
import { PlatformNavProvider } from '@/providers/platform-nav-provider';

export default function AppLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <PlatformNavProvider>
      <div data-slot="layout" className="group/layout bg-background relative z-10 flex min-h-svh flex-col">
        <SiteHeader nav={{ trees: { web: source.pageTree }, searchApi: '/api/search' }} />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        <SiteFooter />
      </div>
    </PlatformNavProvider>
  );
}
