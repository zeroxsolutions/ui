import type { ComponentType, ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { Kbd } from '@/registry/bases/base-ui/ui/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/bases/base-ui/ui/tooltip';

/**
 * An icon button for an editor toolbar: a selected/active state plus a tooltip
 * that surfaces the keyboard shortcut as a <Kbd> chip. The caller supplies the
 * icon, label, resolved shortcut and click handler — the button knows no tool or
 * command. Active state reuses the `secondary` Button variant so a selected
 * control reads identically everywhere. Surfacing the shortcut in the tooltip
 * follows NN/G's guidance to keep shortcuts visible next to the command for
 * learnability: https://www.nngroup.com/articles/split-buttons/
 */
export interface ToolbarButtonProps {
  /** Selected/active state — renders the `secondary` highlight instead of `ghost`. */
  active?: boolean;
  /** Accessible name + tooltip text. */
  label: string;
  /** Resolved shortcut label (e.g. "W"); rendered as a <Kbd> chip in the tooltip. */
  shortcut?: string;
  /** Icon component; alternatively pass `children`. */
  icon?: ComponentType<{ className?: string }>;
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

function ToolbarButton({
  active = false,
  label,
  shortcut,
  icon: Icon,
  children,
  onClick,
  disabled,
  className,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant={active ? 'secondary' : 'ghost'}
            size="icon"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className={className}
          />
        }
      >
        {Icon ? <Icon /> : children}
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut ? (
          <>
            {' '}
            <Kbd>{shortcut}</Kbd>
          </>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

export { ToolbarButton };
