import type { ReactNode } from 'react';

import { StatusIndicator } from '@/registry/bases/base-ui/components/feedback/status-indicator';

/** A pulsing online dot, for a connection still being made. */
function StatusIndicatorPulse(): ReactNode {
  return (
    <div className="flex items-center gap-2 text-sm">
      <StatusIndicator tone="online" pulse />
      <span>Connecting</span>
    </div>
  );
}

export { StatusIndicatorPulse };
