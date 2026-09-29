import type { ReactNode } from 'react';

import { TabCloseButton } from '@/registry/bases/base-ui/components/feedback/tab-close-button';

/** Two editor tabs: one saved, one with unsaved changes. */
function TabCloseButtonDemo(): ReactNode {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="group/tab flex items-center gap-2 rounded-md border px-3 py-1.5">
        <span>index.ts</span>
        <TabCloseButton />
      </div>
      <div className="group/tab flex items-center gap-2 rounded-md border px-3 py-1.5">
        <span>page.tsx</span>
        <TabCloseButton dirty />
      </div>
    </div>
  );
}

export { TabCloseButtonDemo };
