import type { ReactNode } from 'react';

import { DocsSidebar } from '@/components/navigation/docs-sidebar';
import { source } from '@/lib/source';

export default function DocsLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-1 items-start">
      <aside className="sticky top-(--header-height) hidden h-[calc(100svh-var(--header-height))] shrink-0 lg:block">
        <DocsSidebar tree={source.pageTree} className="bg-transparent" />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
