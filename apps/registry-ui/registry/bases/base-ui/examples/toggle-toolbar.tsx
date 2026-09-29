import { BoldIcon, ItalicIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Kbd } from '@/registry/bases/base-ui/ui/kbd';
import { Toggle } from '@/registry/bases/base-ui/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';

/**
 * An editor toolbar's active/inactive controls, composed from upstream parts:
 * a real Toggle carries `aria-pressed`, and its Tooltip surfaces the shortcut
 * as a Kbd chip.
 */
function ToggleToolbar(): ReactNode {
  return (
    <div role="toolbar" aria-label="Text formatting" className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger render={<Toggle aria-label="Bold" defaultPressed />}>
          <BoldIcon />
        </TooltipTrigger>
        <TooltipContent>
          Bold <Kbd>B</Kbd>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Toggle aria-label="Italic" />}>
          <ItalicIcon />
        </TooltipTrigger>
        <TooltipContent>
          Italic <Kbd>I</Kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export { ToggleToolbar };
