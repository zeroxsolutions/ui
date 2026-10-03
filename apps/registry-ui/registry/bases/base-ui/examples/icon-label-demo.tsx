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
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <IconLabel htmlFor="icon-label-demo-filter">
            <SearchIcon aria-hidden />
            <span className="sr-only">Filter</span>
          </IconLabel>
          <Input id="icon-label-demo-filter" placeholder="Filter..." className="w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger render={<IconLabel htmlFor="icon-label-demo-rotation" />}>
              <RotateCWIcon aria-hidden />
              <span className="sr-only">Rotation</span>
            </TooltipTrigger>
            <TooltipContent>Rotation</TooltipContent>
          </Tooltip>
          <Input id="icon-label-demo-rotation" type="number" defaultValue={0} className="w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger render={<IconLabel htmlFor="icon-label-demo-opacity" />}>
              <Blend aria-hidden />
              <span className="sr-only">Opacity</span>
            </TooltipTrigger>
            <TooltipContent>Opacity</TooltipContent>
          </Tooltip>
          <Input id="icon-label-demo-opacity" type="number" defaultValue={100} className="w-20" />
        </div>
      </div>
    </TooltipProvider>
  );
}

export { IconLabelDemo };
