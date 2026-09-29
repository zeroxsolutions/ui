import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * An icon standing in for a field's text label in a dense panel. Give it an
 * `aria-label`, and compose a tooltip around it to reveal the meaning on hover:
 *
 *   <Tooltip>
 *     <TooltipTrigger render={<IconLabel aria-label="Rotation" />}>
 *       <RotateCw />
 *     </TooltipTrigger>
 *     <TooltipContent>Rotation</TooltipContent>
 *   </Tooltip>
 *
 * An svg child with no `size-*` class of its own is drawn at `size-3`.
 */
function IconLabel({ className, ...props }: ComponentProps<'span'>): ReactNode {
  return (
    <span
      data-slot="icon-label"
      className={cn("text-muted-foreground flex items-center [&_svg:not([class*='size-'])]:size-3", className)}
      {...props}
    />
  );
}

export { IconLabel };
