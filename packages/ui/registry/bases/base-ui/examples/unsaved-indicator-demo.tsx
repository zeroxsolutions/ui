import type { ReactNode } from 'react';

import { UnsavedIndicator } from '@/registry/bases/base-ui/components/feedback/unsaved-indicator';

/** The unsaved dot beside a tab label with pending edits. */
function UnsavedIndicatorDemo(): ReactNode {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>page.tsx</span>
      <UnsavedIndicator />
    </div>
  );
}

export { UnsavedIndicatorDemo };
