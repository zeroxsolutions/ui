import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * A small square holding one glyph, tinted by the caller's `className` with
 * theme tokens (the design system ships no tint). It carries no meaning of its
 * own, so one serves model abilities, generation types or any icon the
 * caller picks. Give it an `aria-label`, and compose a tooltip around it when
 * the glyph needs words:
 *
 *   <Tooltip>
 *     <TooltipTrigger render={<IconMedia aria-label="Vision input" className="bg-muted text-muted-foreground" />}>
 *       <EyeIcon />
 *     </TooltipTrigger>
 *     <TooltipContent>Vision input</TooltipContent>
 *   </Tooltip>
 *
 * An svg inside it with no `size-*` class of its own is drawn at `size-3`.
 */
function IconMedia({ className, ...props }: ComponentProps<'span'>): ReactNode {
  return (
    <span
      data-slot="icon-media"
      className={cn(
        "flex size-5 items-center justify-center rounded-sm [&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      {...props}
    />
  );
}

export { IconMedia };
