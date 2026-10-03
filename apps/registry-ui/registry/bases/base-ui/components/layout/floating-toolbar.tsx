import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The floating tool palette of an editor canvas: a rounded, blurred card-colour
 * bar with a hairline ring and a shadow, around the tools the caller composes.
 * It is a `toolbar` landmark, so give it an `aria-label`. Placement (for
 * example `absolute bottom-3 left-1/2 -translate-x-1/2 z-20`) is the caller's
 * `className`. `pointer-events-auto` keeps it clickable inside a
 * `pointer-events-none` canvas overlay.
 */
function FloatingToolbar({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="floating-toolbar"
      role="toolbar"
      className={cn(
        'bg-card/95 ring-foreground/10 pointer-events-auto flex flex-row items-center gap-0.5 rounded-lg px-1.5 py-1 shadow-md ring-1 backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  );
}

export { FloatingToolbar };
