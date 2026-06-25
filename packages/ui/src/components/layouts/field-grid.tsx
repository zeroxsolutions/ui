import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Standard tight grid wrapper for paired/triplet inputs (X+Y, W+H,
 * opacity+blend, count+gutter+margin, …). Bakes only the curated `gap-x-2
 * gap-y-1` spacing decision so sections stay consistent; the consumer picks the
 * column count via `className` (`grid-cols-3`, …).
 */
export function FieldGrid({
  className,
  children,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div className={cn('grid gap-x-2 gap-y-1', className)} {...props}>
      {children}
    </div>
  );
}
