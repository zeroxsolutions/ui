import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

interface FloatingToolbarProps extends ComponentProps<'div'> {
  children: ReactNode;
  /** Accessible name for the `toolbar` landmark (WAI-ARIA Toolbar pattern). */
  label?: string;
}

/**
 * The floating tool palette — a rounded bar with the card background, blur,
 * hairline ring and shadow. Shared chrome for an editor's on-canvas toolbar;
 * fill it with the tool content that differs. The consumer owns placement
 * (e.g. `absolute bottom-3 left-1/2 -translate-x-1/2 z-20`) via `className`.
 *
 * `pointer-events-auto` keeps it interactive even when mounted inside a
 * pointer-events-none canvas overlay; it is a no-op where the surrounding tree
 * already receives pointer events.
 */
export function FloatingToolbar({
  children,
  className,
  label,
  ...props
}: FloatingToolbarProps) {
  return (
    <div
      data-slot="floating-toolbar"
      role="toolbar"
      aria-label={label}
      className={cn(
        'pointer-events-auto flex flex-row items-center gap-0.5 rounded-sm bg-card/95 px-1.5 py-1 shadow-lg ring-1 ring-foreground/10 backdrop-blur-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
