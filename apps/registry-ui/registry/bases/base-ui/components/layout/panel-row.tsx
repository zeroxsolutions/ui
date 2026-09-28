import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

import { PanelFieldGroup } from './panel-field-group';

interface PanelRowProps extends ComponentProps<'div'> {
  /** Optional trailing action (e.g. an aspect-lock toggle, a reset button). It
   *  sits in a fixed icon-button-width slot (a default `Button size="icon"`
   *  fills it exactly); a narrower control is centred. */
  action?: ReactNode;
  /** Column count for the inner grid (default 2); forwarded to `PanelFieldGroup`. */
  cols?: number;
  children: ReactNode;
}

/**
 * `PanelFieldGroup` + a fixed trailing action slot. Use it for any row in a property
 * section that mixes inputs with a side action: the slot is always reserved at a
 * single icon-button width - present or not, with one action or none - so every
 * row's inputs share the same right edge and the panel reads as one aligned grid.
 */
function PanelRow({ action, cols = 2, className, children, ...props }: PanelRowProps) {
  return (
    <div data-slot="panel-row" className={cn('flex items-end gap-1', className)} {...props}>
      <div className="min-w-0 flex-1">
        <PanelFieldGroup cols={cols}>{children}</PanelFieldGroup>
      </div>
      <div className="flex min-w-9 shrink-0 justify-center">{action}</div>
    </div>
  );
}

export { PanelRow };
