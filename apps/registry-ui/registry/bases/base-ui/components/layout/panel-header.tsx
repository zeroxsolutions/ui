import type { HTMLAttributes } from 'react';

import { Separator } from '@/registry/bases/base-ui/ui/separator';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * Panel header - frame for the top strip of any side panel.
 *
 * Compound API:
 *   <PanelHeader>
 *     <PanelHeaderRow>
 *       <PanelHeaderTitle>title + menu trigger</PanelHeaderTitle>
 *       <PanelHeaderActions>collapse button</PanelHeaderActions>
 *     </PanelHeaderRow>
 *     <PanelHeaderRow className="pb-1.5">...optional extra rows...</PanelHeaderRow>
 *   </PanelHeader>
 *
 * No background - the header inherits its parent panel's bg (typically
 * `bg-card`). A trailing `<Separator/>` separates it from the panel body.
 */
function PanelHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="panel-header" className={cn('flex shrink-0 flex-col', className)} {...props}>
      {children}
      <Separator />
    </div>
  );
}

function PanelHeaderRow({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="panel-header-row" className={cn('flex h-9 items-center gap-1 px-2', className)} {...props} />;
}

function PanelHeaderTitle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="panel-header-title"
      className={cn('flex min-w-0 flex-1 items-center gap-1', className)}
      {...props}
    />
  );
}

function PanelHeaderActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="panel-header-actions" className={cn('flex shrink-0 items-center gap-0.5', className)} {...props} />
  );
}

export { PanelHeader, PanelHeaderRow, PanelHeaderTitle, PanelHeaderActions };
