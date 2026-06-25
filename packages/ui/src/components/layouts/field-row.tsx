import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { FieldGrid } from './field-grid';

interface FieldRowProps extends ComponentProps<'div'> {
  /** Optional trailing action (e.g. an aspect-lock toggle, a reset button). It
   *  sits in a fixed icon-button-width slot (a default `Button size="icon"`
   *  fills it exactly); a narrower control is centred. */
  action?: ReactNode;
  /** Column count for the inner grid (default 2); forwarded to `FieldGrid`. */
  cols?: number;
  children: ReactNode;
}

/**
 * Field grid + a fixed trailing action slot. Use it for any row in a property
 * section that mixes inputs with a side action: the slot is always reserved at a
 * single icon-button width — present or not, with one action or none — so every
 * row's inputs share the same right edge and the panel reads as one aligned grid.
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
      <div className="flex min-w-9 shrink-0 justify-center">{action}</div>
    </div>
  );
}
