import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The top strip of a side panel: one or more `PanelHeaderRow`s over a bottom
 * border. It paints no background, so it takes its panel's (usually `bg-card`).
 *
 *   <PanelHeader>
 *     <PanelHeaderRow>
 *       <PanelHeaderTitle>title + menu trigger</PanelHeaderTitle>
 *       <PanelHeaderActions>collapse button</PanelHeaderActions>
 *     </PanelHeaderRow>
 *   </PanelHeader>
 */
function PanelHeader({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return <div data-slot="panel-header" className={cn('flex shrink-0 flex-col border-b', className)} {...props} />;
}

/** One fixed-height row of the header. */
function PanelHeaderRow({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return <div data-slot="panel-header-row" className={cn('flex h-9 items-center gap-1 px-2', className)} {...props} />;
}

/** The row's growing leading part: the title and anything inline with it. */
function PanelHeaderTitle({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="panel-header-title"
      className={cn('flex min-w-0 flex-1 items-center gap-1', className)}
      {...props}
    />
  );
}

/** The row's trailing buttons; never shrinks. */
function PanelHeaderActions({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div data-slot="panel-header-actions" className={cn('flex shrink-0 items-center gap-0.5', className)} {...props} />
  );
}

export { PanelHeader, PanelHeaderRow, PanelHeaderTitle, PanelHeaderActions };
