import type { ReactNode } from 'react';

import { StatusIndicator } from '@/registry/bases/base-ui/components/feedback/status-indicator';

/** The online tone beside the state it reports. */
function StatusIndicatorOnline(): ReactNode {
  return (
    <div className="flex items-center gap-2 text-sm">
      <StatusIndicator tone="online" />
      <span>Connected</span>
    </div>
  );
}

export { StatusIndicatorOnline };
