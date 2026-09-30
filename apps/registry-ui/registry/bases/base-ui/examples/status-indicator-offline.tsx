import type { ReactNode } from 'react';

import { StatusIndicator } from '@/registry/bases/base-ui/components/feedback/status-indicator';

/** The offline tone beside the state it reports. */
function StatusIndicatorOffline(): ReactNode {
  return (
    <div className="flex items-center gap-2 text-sm">
      <StatusIndicator tone="offline" />
      <span>Disconnected</span>
    </div>
  );
}

export { StatusIndicatorOffline };
