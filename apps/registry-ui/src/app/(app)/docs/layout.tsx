import type { CSSProperties, ReactNode } from 'react';

import { DocsSidebar, SidebarProvider } from '@/components/navigation/docs-sidebar';
import { source } from '@/lib/source';

/**
 * The docs' two columns: the sidebar, sticky under the header and as tall as the viewport below it,
 * then the page. The sidebar takes the page's own background rather than the theme's sidebar tint.
 */
export default function DocsLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="mx-auto flex w-full flex-1 flex-col px-2">
      <SidebarProvider
        className="min-h-min flex-1 items-start lg:grid lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]"
        style={{ '--sidebar-width': 'calc(var(--spacing) * 72)', '--sidebar': 'var(--background)' } as CSSProperties}
      >
        <DocsSidebar
          tree={source.pageTree}
          className="sticky top-(--header-height) hidden h-[calc(100svh-var(--header-height))] lg:flex"
        />
        <div className="h-full w-full">{children}</div>
      </SidebarProvider>
    </div>
  );
}
