import type { ReactNode } from 'react';

import { FieldGrid } from './field-grid';

interface FieldRowProps {
  /** Number of columns in the inner grid. Defaults to 2. */
  cols?: 1 | 2 | 3 | 4;
  /** Optional trailing action (e.g. an aspect-lock toggle, flip buttons).
   *  When omitted, an icon-button-sized spacer is rendered so multiple rows in a
   *  section line up at the right edge. */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * Field grid + optional trailing icon-button slot. Use it for any row in a
 * property section that mixes inputs with a side action — every row reserves the
 * same trailing slot, so panels align cleanly even when one row has an action
 * and another doesn't.
 */
export function FieldRow({ cols = 2, action, children }: FieldRowProps) {
  return (
    <div className="flex items-end gap-1">
      <div className="flex-1 min-w-0">
        <FieldGrid cols={cols}>{children}</FieldGrid>
      </div>
      {action ?? <div className="size-7 shrink-0" aria-hidden />}
    </div>
  );
}
