import * as React from 'react';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Trash2 } from 'lucide-react';
import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/registry/bases/base-ui/ui/item';
import { Switch } from '@/registry/bases/base-ui/ui/switch';
import { Skeleton } from '@/registry/bases/base-ui/ui/skeleton';

interface ModelListProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  /** Header title (e.g. "Model list"). */
  title?: React.ReactNode;
  /** Trailing header slot - search, refresh, and the like. */
  controls?: React.ReactNode;
  /** Optional tab bar rendered below the header. */
  tabs?: React.ReactNode;
  /** The scrollable list region content (item groups, an empty state, or a
   *  loading skeleton). */
  children?: React.ReactNode;
}

/**
 * The presentational frame for a model list section: a header carrying a `title`
 * and a trailing `controls` slot (search, refresh), an optional `tabs` slot
 * below it, and a scrollable region for `children`. It owns no list state - it
 * does not filter, group, sort, or paginate; the consumer supplies prepared
 * children and controls. Domain-free. Place it in a height-constrained flex
 * parent so the list region scrolls.
 */
function ModelList({ title, controls, tabs, children, className, ...props }: ModelListProps) {
  return (
    <div data-slot="model-list" className={cn('flex min-h-0 flex-1 flex-col', className)} {...props}>
      <div className="flex flex-col gap-2 px-1 pt-1">
        <div className="flex items-center justify-between gap-2">
          {title != null && <h3 className="text-base font-semibold tracking-tight">{title}</h3>}
          {controls != null && <div className="flex shrink-0 items-center gap-2">{controls}</div>}
        </div>
        {tabs}
      </div>
      <div data-slot="model-list-content" className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 py-3">{children}</div>
      </div>
    </div>
  );
}

interface ModelListItemProps extends Omit<React.ComponentProps<'div'>, 'id' | 'title'> {
  /** Primary line - the model display name. */
  name: React.ReactNode;
  /** Secondary line under the name - the model id. */
  modelId?: React.ReactNode;
  /** Leading logo slot, rendered verbatim (e.g. an `AiProviderIcon`). */
  media?: React.ReactNode;
  /** Meta region before the controls - capability / token chips. */
  meta?: React.ReactNode;
  /** Enable toggle state. Provide to render a `Switch`; omit `onEnabledChange`
   *  to render it read-only. */
  enabled?: boolean;
  /** Called with the next enabled state when the toggle is activated. */
  onEnabledChange?: (enabled: boolean) => void;
  /** Show a trailing remove control when provided. */
  onRemove?: () => void;
  /** Extra trailing content, before the toggle (escape hatch). */
  action?: React.ReactNode;
  /** Dim the item and disable the toggle - listed but unusable. */
  unavailable?: boolean;
}

/**
 * One model as a horizontal list item, built on the shipped `Item`: a leading
 * media slot (the provider logo, e.g. an `AiProviderIcon`), the model name over
 * its id, a meta slot for capability / token chips, and trailing controls - an
 * optional enable `Switch` (from `enabled` / `onEnabledChange`) and remove
 * `Button` (from `onRemove`), plus an `action` escape hatch. Domain-free: it
 * imports no model or capability type; every value is a prop or a slot. An
 * `unavailable` model stays listed but is dimmed and its toggle disabled.
 * @example <ModelListItem name="GPT-4o" modelId="gpt-4o" media={<AiProviderIcon provider="openai" />} enabled onEnabledChange={setOn} />
 */
function ModelListItem({
  name,
  modelId,
  media,
  meta,
  enabled,
  onEnabledChange,
  onRemove,
  action,
  unavailable = false,
  className,
  ...props
}: ModelListItemProps) {
  return (
    <Item data-slot="model-list-item" size="sm" className={cn(unavailable && 'opacity-55', className)} {...props}>
      {media != null && <ItemMedia>{media}</ItemMedia>}
      <ItemContent>
        <ItemTitle>{name}</ItemTitle>
        {modelId != null && <ItemDescription>{modelId}</ItemDescription>}
      </ItemContent>
      <ItemActions>
        {meta}
        {action}
        {enabled !== undefined && (
          <Switch
            checked={enabled}
            disabled={!onEnabledChange || unavailable}
            onCheckedChange={onEnabledChange ? (checked) => onEnabledChange(checked) : undefined}
          />
        )}
        {onRemove && (
          <Button
            aria-label="Remove model"
            className="text-muted-foreground hover:text-destructive size-7"
            onClick={onRemove}
            size="icon-sm"
            variant="ghost"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </ItemActions>
    </Item>
  );
}

interface ModelListSkeletonProps extends React.ComponentProps<'div'> {
  /** Number of placeholder items. Defaults to 6. */
  count?: number;
}

/**
 * Placeholder items shown while a model list loads. Each mirrors
 * `ModelListItem`'s shape - a leading media placeholder, two stacked text-line
 * placeholders, and a trailing control placeholder - composed from the shipped
 * `Skeleton`. Presentational and domain-free.
 */
function ModelListSkeleton({ count = 6, className, ...props }: ModelListSkeletonProps) {
  return (
    <div data-slot="model-list-skeleton" className={cn('flex flex-col gap-2', className)} {...props}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} data-slot="model-list-skeleton-item" className="flex items-center gap-3 rounded-md p-2.5">
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-4 w-8 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export { ModelList, ModelListItem, ModelListSkeleton };
export type { ModelListProps, ModelListItemProps, ModelListSkeletonProps };
