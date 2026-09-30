import type { ReactNode } from 'react';

import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { source } from '@/lib/source';

export default function AppLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div data-slot="layout" className="group/layout bg-background relative z-10 flex min-h-svh flex-col">
      <SiteHeader tree={source.pageTree} />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      <SiteFooter />
    </div>
  );
}
