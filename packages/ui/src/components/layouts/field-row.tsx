import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { FieldGrid } from './field-grid';

interface FieldRowProps extends ComponentProps<'div'> {
  /** Optional trailing action (e.g. an aspect-lock toggle, flip buttons).
   *  When omitted, an icon-button-sized spacer is rendered so multiple rows in a
   *  section line up at the right edge. */
  action?: ReactNode;
  /** Column count for the inner grid (default 2); forwarded to `FieldGrid`. */
  cols?: number;
  children: ReactNode;
}

/**
 * Field grid + optional trailing icon-button slot. Use it for any row in a
 * property section that mixes inputs with a side action — every row reserves the
 * same trailing slot, so panels align cleanly even when one row has an action
 * and another doesn't.
 */
export function FieldRow({
  action,
  cols = 2,
  className,
  children,
  ...props
}: FieldRowProps) {
  return (
    <div className={cn('flex items-end gap-1', className)} {...props}>
      <div className="flex-1 min-w-0">
        <FieldGrid cols={cols}>{children}</FieldGrid>
      </div>
      {action ?? <div className="size-7 shrink-0" aria-hidden />}
    </div>
  );
}
