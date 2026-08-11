import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The unsaved-changes dot an editor shows on a tab — a plain filled circle.
 * Pair it with a close button that morphs into it on hover.
 */
function DirtyDot({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="dirty-dot"
      aria-label="Unsaved changes"
      className={cn('size-2 shrink-0 rounded-full bg-foreground/70', className)}
      {...props}
    />
  );
}

export { DirtyDot };
