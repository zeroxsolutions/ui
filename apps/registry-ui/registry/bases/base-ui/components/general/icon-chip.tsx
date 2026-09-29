import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * A small square holding one glyph, tinted by the caller's `className` (the
 * design system ships no tint). It carries no meaning of its own, so one chip
 * serves model abilities, generation types or any icon the caller picks. Give
 * it an `aria-label`, and compose a tooltip around it when the glyph needs words:
 *
 *   <Tooltip>
 *     <TooltipTrigger render={<IconChip aria-label="Vision input" className="bg-emerald-500/15 text-emerald-600" />}>
 *       <Eye className="size-3" />
 *     </TooltipTrigger>
 *     <TooltipContent>Vision input</TooltipContent>
 *   </Tooltip>
 */
function IconChip({ className, ...props }: ComponentProps<'span'>): ReactNode {
  return (
    <span
      data-slot="icon-chip"
      className={cn('flex size-5 items-center justify-center rounded-sm', className)}
      {...props}
    />
  );
}

export { IconChip };
