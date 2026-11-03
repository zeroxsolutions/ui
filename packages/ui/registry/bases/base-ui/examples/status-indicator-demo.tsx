import type { ReactNode } from 'react';

import { StatusIndicator } from '@/registry/bases/base-ui/components/feedback/status-indicator';

/** Every status tone beside its label, with a pulsing connecting state. */
function StatusIndicatorDemo(): ReactNode {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center gap-2">
        <StatusIndicator tone="online" />
        <span>Online</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusIndicator tone="online" pulse />
        <span>Connecting</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusIndicator tone="idle" />
        <span>Idle</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusIndicator tone="busy" />
        <span>Busy</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusIndicator tone="offline" />
        <span>Offline</span>
      </div>
    </div>
  );
}

export { StatusIndicatorDemo };
