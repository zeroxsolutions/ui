import type { ReactNode } from 'react';

import { IconMedia } from '@/registry/bases/base-ui/components/general/icon-media';
import { EyeIcon } from '@/registry/bases/base-ui/ui/eye';
import { MessageSquareIcon } from '@/registry/bases/base-ui/ui/message-square';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import { WrenchIcon } from '@/registry/bases/base-ui/ui/wrench';

/** A chat-ability glyph named by its own caption, beside two named only through a composed tooltip. */
function IconMediaDemo(): ReactNode {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <IconMedia aria-label="Chat" className="bg-primary text-primary-foreground">
            <MessageSquareIcon aria-hidden />
          </IconMedia>
          <span className="text-sm">Chat</span>
        </div>
        <Tooltip>
          <TooltipTrigger render={<IconMedia aria-label="Vision input" className="bg-muted text-muted-foreground" />}>
            <EyeIcon aria-hidden />
          </TooltipTrigger>
          <TooltipContent>Vision input</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<IconMedia aria-label="Tool use" className="bg-muted text-muted-foreground" />}>
            <WrenchIcon aria-hidden />
          </TooltipTrigger>
          <TooltipContent>Tool use</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export { IconMediaDemo };
