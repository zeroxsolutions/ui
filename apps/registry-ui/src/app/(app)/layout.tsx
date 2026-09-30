import type { ReactNode } from 'react';

import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { source } from '@/lib/source';

export default function AppLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="flex min-h-svh flex-col [--header-height:--spacing(14)]">
      <SiteHeader tree={source.pageTree} />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </div>
  );
}
