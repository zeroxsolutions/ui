import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

export interface FieldGridProps extends ComponentProps<'div'> {
  /**
   * Column count, rendered as a computed `grid-template-columns: repeat(n, …)`
   * — NOT a `grid-cols-N` utility. That makes it accept ANY count, including one
   * derived at runtime (`cols={axes.length}`), which a static Tailwind class
   * can't express (the JIT only detects complete literal class strings). Omit to
   * let `className` (`grid-cols-*`) drive the columns instead.
   */
  cols?: number;
}

/**
 * Standard tight grid wrapper for paired/triplet inputs (X+Y, W+H,
 * opacity+blend, count+gutter+margin, …). Bakes only the curated `gap-x-2
 * gap-y-1` spacing decision so sections stay consistent; pass `cols` for a
 * (possibly dynamic) column count, or drive it via `className`.
 */
export function FieldGrid({
  cols,
  className,
  children,
  style,
  ...props
}: FieldGridProps) {
  return (
    <div
      data-slot="field-grid"
      className={cn('grid gap-x-2 gap-y-1', className)}
      style={
        cols
          ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, ...style }
          : style
      }
      {...props}
    >
      {children}
    </div>
  );
}
