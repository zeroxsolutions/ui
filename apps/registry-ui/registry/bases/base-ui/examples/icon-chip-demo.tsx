import type { ReactNode } from 'react';

import { IconChip } from '@/registry/bases/base-ui/components/general/icon-chip';
import { EyeIcon } from '@/registry/bases/base-ui/ui/eye';
import { MessageSquareIcon } from '@/registry/bases/base-ui/ui/message-square';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import { WrenchIcon } from '@/registry/bases/base-ui/ui/wrench';

/** A chat-ability chip named by its own caption, beside two chips named only through a composed tooltip. */
function IconChipDemo(): ReactNode {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <IconChip aria-label="Chat" className="bg-primary text-primary-foreground">
            <MessageSquareIcon aria-hidden />
          </IconChip>
          <span className="text-sm">Chat</span>
        </div>
        <Tooltip>
          <TooltipTrigger render={<IconChip aria-label="Vision input" className="bg-muted text-muted-foreground" />}>
            <EyeIcon aria-hidden />
          </TooltipTrigger>
          <TooltipContent>Vision input</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<IconChip aria-label="Tool use" className="bg-muted text-muted-foreground" />}>
            <WrenchIcon aria-hidden />
          </TooltipTrigger>
          <TooltipContent>Tool use</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export { IconChipDemo };
