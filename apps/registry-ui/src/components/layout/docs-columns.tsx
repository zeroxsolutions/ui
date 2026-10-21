import type { CSSProperties, ReactNode } from 'react';

import { SidebarProvider } from '@/components/navigation/docs-sidebar';

interface DocsColumnsProps {
  /** The page list, sticky under the header and as tall as the viewport below it, shown from the large breakpoint. */
  sidebar: ReactNode;
  children: ReactNode;
}

/** The docs' two columns: the sidebar, then the page. */
function DocsColumns({ sidebar, children }: DocsColumnsProps): ReactNode {
  return (
    <div className="mx-auto flex w-full flex-1 flex-col px-2">
      <SidebarProvider
        className="min-h-min flex-1 items-start lg:grid lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]"
        style={{ '--sidebar-width': 'calc(var(--spacing) * 72)' } as CSSProperties}
      >
        <div className="sticky top-(--header-height) hidden h-[calc(100svh-var(--header-height))] lg:flex">
          {sidebar}
        </div>
        <div className="h-full w-full">{children}</div>
      </SidebarProvider>
    </div>
  );
}

export { DocsColumns };
