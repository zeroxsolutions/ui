import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * The floating tool-palette shell — a centered, bottom-anchored rounded bar with
 * the card background, blur, hairline ring and shadow. Shared chrome for an
 * editor's on-canvas toolbar; fill it with the tool content that differs.
 *
 * `pointer-events-auto` keeps it interactive even when mounted inside a
 * pointer-events-none canvas overlay; it is a no-op where the surrounding tree
 * already receives pointer events.
 */
export function FloatingToolbarShell({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  /** Accessible name for the `toolbar` landmark (WAI-ARIA Toolbar pattern). */
  label?: string;
}) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      className={cn(
        'pointer-events-auto absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 flex-row items-center gap-0.5 rounded-sm bg-card/95 px-1.5 py-1 shadow-lg ring-1 ring-foreground/10 backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}
