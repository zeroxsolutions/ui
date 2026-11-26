'use client';

import type { ReactNode } from 'react';
import { Maximize2Icon } from '@/registry/bases/base-ui/icons/lucide/maximize-2-icon';
import { Toggle } from '@/registry/bases/base-ui/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import { ChromeControl } from '../ui/chrome-icon';
import type { LayoutWords } from './layout-words';

export interface WidthToggleProps {
  /** Whether the block bleeds to its container's edges. */
  full: boolean;
  /** Called with whether the block is to bleed; the view sets `width: 'full'`, or takes it back. */
  onChange(full: boolean): void;
  words: LayoutWords;
  disabled?: boolean;
}

/**
 * The toggle that bleeds a block to its container's edges, named and shown in a tooltip from words. A surface that
 * cannot draw a bleed, as the email, does not draw it. Drawn inside a `TooltipProvider`.
 */
export function WidthToggle({ full, onChange, words, disabled = false }: WidthToggleProps): ReactNode {
  return (
    <ChromeControl
      icon={Maximize2Icon}
      iconSized
      render={(control) => (
        <Tooltip>
          <TooltipTrigger
            render={
              <Toggle
                size="sm"
                pressed={full}
                disabled={disabled}
                aria-label={words.fullWidth}
                onPressedChange={onChange}
                {...control}
              />
            }
          />
          <TooltipContent>{words.fullWidth}</TooltipContent>
        </Tooltip>
      )}
    />
  );
}
