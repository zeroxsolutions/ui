import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The unsaved-changes dot an editor shows on a tab — a plain filled circle.
 * Pair it with a close button that morphs into it on hover.
 */
function UnsavedIndicator({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="unsaved-indicator"
      aria-label="Unsaved changes"
      className={cn('bg-foreground/70 size-2 shrink-0 rounded-full', className)}
      {...props}
    />
  );
}

export { UnsavedIndicator };
