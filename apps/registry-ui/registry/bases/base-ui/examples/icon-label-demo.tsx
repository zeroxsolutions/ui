import { Blend, RotateCw, Search } from 'lucide-react';
import type { ReactNode } from 'react';

import { IconLabel } from '@/registry/bases/base-ui/components/general/icon-label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';

/** A universally-read field icon beside two others whose meaning is revealed through a composed tooltip. */
function IconLabelDemo(): ReactNode {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <IconLabel aria-label="Search">
            <Search />
          </IconLabel>
          <input className="border-input h-8 w-24 rounded-md border px-2 text-sm" placeholder="Filter..." />
        </div>
        <Tooltip>
          <TooltipTrigger render={<IconLabel aria-label="Rotation" />}>
            <RotateCw />
          </TooltipTrigger>
          <TooltipContent>Rotation</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<IconLabel aria-label="Opacity" />}>
            <Blend />
          </TooltipTrigger>
          <TooltipContent>Opacity</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export { IconLabelDemo };
