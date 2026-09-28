import type { ComponentProps, ReactNode } from 'react';

import { Badge } from '@/registry/bases/base-ui/ui/badge';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Separator } from '@/registry/bases/base-ui/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
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
    <div data-slot="section" className={className} {...props}>
      <div className="mt-1 flex h-8 items-center gap-1 px-2.5">
        {isCollapsible ? (
          <button
            type="button"
            onClick={onToggle}
            className="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex min-w-0 flex-1 items-center justify-start gap-1 rounded-md text-left transition-colors outline-none focus-visible:ring-2"
          >
            {isOpen ? (
              <ChevronDown className="text-muted-foreground size-3" />
            ) : (
              <ChevronRight className="text-muted-foreground size-3" />
            )}
            <span className="truncate text-xs font-medium">{title}</span>
            {count != null && count > 0 && (
              <Badge variant="secondary" className="shrink-0">
                {count}
              </Badge>
            )}
          </button>
        ) : (
          <span className="flex-1 truncate text-xs font-medium">{title}</span>
        )}
        {actions}
        {onAdd && (
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon" data-testid={onAddTestId} onClick={onAdd} />}>
              <Plus className="size-3" />
            </TooltipTrigger>
            <TooltipContent>{addLabel ?? `Add ${title.toLowerCase()}`}</TooltipContent>
          </Tooltip>
        )}
      </div>
      {isOpen && <div className="space-y-2 px-2.5 pt-1 pb-2.5">{children}</div>}
      <Separator />
    </div>
  );
}
