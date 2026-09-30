import type { ReactNode } from 'react';

import { StatusIndicator } from '@/registry/bases/base-ui/components/feedback/status-indicator';

/** The busy tone beside the state it reports. */
function StatusIndicatorBusy(): ReactNode {
  return (
    <div className="flex items-center gap-2 text-sm">
      <StatusIndicator tone="busy" />
      <span>Unavailable</span>
    </div>
  );
}

export { StatusIndicatorBusy };
