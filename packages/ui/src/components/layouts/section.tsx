import type { ComponentProps, ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

/**
 * A titled, optionally-collapsible panel section with a count badge and an
 * optional add button. Use it to group related controls or rows inside a panel;
 * pass `onToggle` to make it collapsible and `onAdd` for the trailing add action.
 */
export function Section({
  title,
  count,
  onAdd,
  onAddTestId,
  addLabel,
  open,
  onToggle,
  actions,
  children,
  className,
  ...props
}: Omit<ComponentProps<'div'>, 'title'> & {
  title: string;
  count?: number;
  onAdd?: () => void;
  onAddTestId?: string;
  /** Tooltip on the add button; defaults to `Add {title}`. */
  addLabel?: ReactNode;
  open?: boolean;
  onToggle?: () => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const isCollapsible = onToggle != null;
  const isOpen = open ?? true;
  return (
    <div className={className} {...props}>
      <div className="flex items-center h-8 px-2.5 mt-1 gap-1">
        {isCollapsible ? (
          <Button
            variant="ghost"
            onClick={onToggle}
            className="flex items-center gap-1 flex-1 min-w-0 h-auto p-0 justify-start"
          >
            {isOpen ? (
              <ChevronDown className="size-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3 text-muted-foreground" />
            )}
            <span className="text-xs font-medium truncate">{title}</span>
            {count != null && count > 0 && (
              <Badge variant="secondary" className="shrink-0">
                {count}
              </Badge>
            )}
          </Button>
        ) : (
          <span className="text-xs font-medium truncate flex-1">{title}</span>
        )}
        {actions}
        {onAdd && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid={onAddTestId}
                  onClick={onAdd}
                />
              }
            >
              <Plus className="size-3" />
            </TooltipTrigger>
            <TooltipContent>
              {addLabel ?? `Add ${title.toLowerCase()}`}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {isOpen && <div className="px-2.5 pt-1 pb-2.5 space-y-2">{children}</div>}
      <Separator />
    </div>
  );
}
