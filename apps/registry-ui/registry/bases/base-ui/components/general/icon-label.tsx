import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * An icon standing in for a field's text label in a dense panel: a `<label>`
 * that `htmlFor` ties to its control, so the control takes its name from it.
 * The words go in as children beside the icon, hidden from sight with
 * `sr-only`, and a tooltip composed around it shows them on hover:
 *
 *   <Tooltip>
 *     <TooltipTrigger render={<IconLabel htmlFor="rotation" />}>
 *       <RotateCw aria-hidden />
 *       <span className="sr-only">Rotation</span>
 *     </TooltipTrigger>
 *     <TooltipContent>Rotation</TooltipContent>
 *   </Tooltip>
 *   <Input id="rotation" type="number" />
 *
 * An svg child with no `size-*` class of its own is drawn at `size-3`.
 */
function IconLabel({ className, ...props }: ComponentProps<'label'>): ReactNode {
  return (
    <label
      data-slot="icon-label"
      className={cn("text-muted-foreground flex items-center [&_svg:not([class*='size-'])]:size-3", className)}
      {...props}
    />
  );
}

export { IconLabel };
