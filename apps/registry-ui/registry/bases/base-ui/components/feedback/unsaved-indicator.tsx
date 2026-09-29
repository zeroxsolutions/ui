import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The unsaved-changes dot an editor shows on a tab. It is announced as an image
 * named "Unsaved changes"; pass `aria-label` to name it in another language.
 */
function UnsavedIndicator({ className, ...props }: React.ComponentProps<'span'>): React.ReactNode {
  return (
    <span
      data-slot="unsaved-indicator"
      role="img"
      aria-label="Unsaved changes"
      className={cn('bg-foreground/70 size-2 shrink-0 rounded-full', className)}
      {...props}
    />
  );
}

export { UnsavedIndicator };
