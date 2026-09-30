import type { CSSProperties, ReactNode } from 'react';

import { DocsSidebar, SidebarProvider } from '@/components/navigation/docs-sidebar';
import { source } from '@/lib/source';

export default function DocsLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="container-wrapper flex flex-1 flex-col px-2">
      <SidebarProvider
        className="min-h-min flex-1 items-start px-0 [--top-spacing:0] lg:grid lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)] lg:[--top-spacing:calc(var(--spacing)*4)]"
        style={{ '--sidebar-width': 'calc(var(--spacing) * 72)' } as CSSProperties}
      >
        <DocsSidebar tree={source.pageTree} />
        <div className="h-full w-full">{children}</div>
      </SidebarProvider>
    </div>
  );
}
