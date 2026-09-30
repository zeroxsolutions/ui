import type { CSSProperties, ReactNode } from 'react';

import { DocsSidebar, DocsSidebarProvider } from '@/components/navigation/docs-sidebar';
import { source } from '@/lib/source';

/**
 * The rails' sizes. Each rail stops `--docs-rail-height` below `--docs-rail-top`, which leaves the footer's
 * room at the foot of the viewport: a rail that met the footer would be pushed up by it in one step.
 * `--sidebar-width` goes through `style` because the provider sets its own default there.
 */
const docsRails = {
  '--sidebar-width': 'calc(var(--spacing) * 72)',
  '--docs-rail-top': 'calc(var(--header-height) + var(--spacing) * 4)',
  '--docs-rail-height': 'calc(100svh - 10rem)',
  '--docs-columns': 'var(--sidebar-width) minmax(0, 1fr)',
} as CSSProperties;

export default function DocsLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <DocsSidebarProvider
      className="min-h-min flex-1 items-start lg:grid lg:grid-cols-(--docs-columns)"
      style={docsRails}
    >
      <DocsSidebar tree={source.pageTree} />
      <div className="w-full min-w-0">{children}</div>
    </DocsSidebarProvider>
  );
}
