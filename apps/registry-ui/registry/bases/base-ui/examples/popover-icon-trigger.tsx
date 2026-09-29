import { SlidersHorizontalIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/bases/base-ui/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';

/**
 * A ghost icon button whose tooltip describes the popover it opens, composed
 * from upstream parts: Popover wraps Tooltip so the TooltipTrigger's render
 * chain (PopoverTrigger, then Button) labels the trigger without stealing its
 * click.
 */
function PopoverIconTrigger(): ReactNode {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={<PopoverTrigger render={<Button variant="ghost" size="icon" aria-label="Display settings" />} />}
        >
          <SlidersHorizontalIcon />
        </TooltipTrigger>
        <TooltipContent>Display settings</TooltipContent>
      </Tooltip>
      <PopoverContent align="end">
        <p className="text-muted-foreground text-sm">Adjust font size, line height and theme.</p>
      </PopoverContent>
    </Popover>
  );
}

export { PopoverIconTrigger };
