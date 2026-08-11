import type { ComponentProps, ComponentType } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/bases/base-ui/ui/tooltip';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface IconLabelProps extends ComponentProps<'span'> {
  icon: ComponentType<{ className?: string }>;
  tooltip: string;
}

/**
 * An icon-only form label with a hover tooltip — for dense panels that label
 * fields with an icon (no verbose text) and reveal the meaning on hover. Use
 * for a field's `label` slot where space is tight.
 */
function IconLabel({
  icon: Icon,
  tooltip,
  className,
  ...props
}: IconLabelProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            data-slot="icon-label"
            className={cn('flex items-center text-muted-foreground', className)}
            {...props}
          />
        }
      >
        <Icon className="size-3" />
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export { IconLabel };
