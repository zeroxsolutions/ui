import { Blend } from 'lucide-react';
import type { ReactNode } from 'react';

import { IconLabel } from '@/registry/bases/base-ui/components/general/icon-label';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { RotateCWIcon } from '@/registry/bases/base-ui/ui/rotate-cw';
import { SearchIcon } from '@/registry/bases/base-ui/ui/search';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';

/** A universally-read field icon beside two others whose meaning is revealed through a composed tooltip. */
function IconLabelDemo(): ReactNode {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <IconLabel aria-label="Search">
            <SearchIcon aria-hidden />
          </IconLabel>
          <Input aria-label="Filter" placeholder="Filter..." className="w-32" />
        </div>
        <Tooltip>
          <TooltipTrigger render={<IconLabel aria-label="Rotation" />}>
            <RotateCWIcon aria-hidden />
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
