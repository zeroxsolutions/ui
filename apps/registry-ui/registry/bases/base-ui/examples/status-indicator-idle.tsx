import type { ReactNode } from 'react';

import { StatusIndicator } from '@/registry/bases/base-ui/components/feedback/status-indicator';

/** The idle tone beside the state it reports. */
function StatusIndicatorIdle(): ReactNode {
  return (
    <div className="flex items-center gap-2 text-sm">
      <StatusIndicator tone="idle" />
      <span>Away</span>
    </div>
  );
}

export { StatusIndicatorIdle };
