import type { ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/bases/base-ui/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';

/**
 * A ghost icon button that surfaces a hover/focus tooltip and opens a popover —
 * the "settings / advanced" affordance panels otherwise hand-roll. It owns the
 * fixed composition
 *
 *   Popover > Tooltip > TooltipTrigger(render PopoverTrigger(render Button))
 *
 * so the tooltip describes the popover trigger without stealing its click (the
 * WAI guidance for a control that both labels and activates). The caller supplies
 * only what differs: the trigger glyph, the tooltip text, the popover body, and
 * the popover placement/classes.
 */
export interface PopoverIconButtonProps {
  /** Tooltip text shown on hover/focus of the trigger. */
  tooltip: ReactNode;
  /** Glyph rendered inside the ghost icon button; the caller controls size/colour. */
  icon: ReactNode;
  /**
   * Accessible name for the button. Omit to leave the button without an
   * `aria-label` (some triggers derive their name elsewhere).
   */
  ariaLabel?: string;
  disabled?: boolean;
  /** Extra classes merged onto the trigger Button (e.g. `"size-5 shrink-0"`). */
  buttonClassName?: string;
  /** PopoverContent alignment (pass-through to Base UI; default `center`). */
  align?: 'start' | 'center' | 'end';
  /** PopoverContent side (pass-through to Base UI; default `bottom`). */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Extra classes merged onto the PopoverContent. */
  contentClassName?: string;
  /** The popover body. */
  children: ReactNode;
}

function PopoverIconButton({
  tooltip,
  icon,
  ariaLabel,
  disabled,
  buttonClassName,
  align,
  side,
  contentClassName,
  children,
}: PopoverIconButtonProps) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  aria-label={ariaLabel}
                  className={buttonClassName}
                />
              }
            />
          }
        >
          {icon}
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
      <PopoverContent align={align} side={side} className={contentClassName}>
        {children}
      </PopoverContent>
    </Popover>
  );
}

export { PopoverIconButton };
