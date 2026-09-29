import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * One row of a property section: the fields (usually a `PanelFieldGroup`) and a
 * trailing `PanelRowAction`. The action column is part of the row's template,
 * at least one icon-button wide whether an action is composed or not, so every
 * row in a panel shares the same right edge.
 */
function PanelRow({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="panel-row"
      className={cn('grid grid-cols-[minmax(0,1fr)_minmax(--spacing(9),auto)] items-end gap-1', className)}
      {...props}
    />
  );
}

/** The trailing action of a `PanelRow`, such as an aspect-lock toggle or a reset button, centred in its column. */
function PanelRowAction({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return <div data-slot="panel-row-action" className={cn('col-start-2 flex justify-center', className)} {...props} />;
}

export { PanelRow, PanelRowAction };
