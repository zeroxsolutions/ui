import { Eye, MessageSquare, Wrench } from 'lucide-react';
import type { ReactNode } from 'react';

import { IconChip } from '@/registry/bases/base-ui/components/general/icon-chip';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';

/** A chat-ability chip named by its own caption, beside two chips named only through a composed tooltip. */
function IconChipDemo(): ReactNode {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <IconChip aria-label="Chat" className="bg-violet-500/15 text-violet-600">
            <MessageSquare className="size-3" />
          </IconChip>
          <span className="text-sm">Chat</span>
        </div>
        <Tooltip>
          <TooltipTrigger
            render={<IconChip aria-label="Vision input" className="bg-emerald-500/15 text-emerald-600" />}
          >
            <Eye className="size-3" />
          </TooltipTrigger>
          <TooltipContent>Vision input</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<IconChip aria-label="Tool use" className="bg-sky-500/15 text-sky-600" />}>
            <Wrench className="size-3" />
          </TooltipTrigger>
          <TooltipContent>Tool use</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export { IconChipDemo };
