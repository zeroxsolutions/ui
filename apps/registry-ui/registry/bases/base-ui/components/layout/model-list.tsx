import * as React from 'react';
import { Trash2 } from 'lucide-react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Skeleton } from '@/registry/bases/base-ui/ui/skeleton';

/**
 * The frame for a model list section: a `ModelListHeader` over a scrolling
 * `ModelListContent`. It owns no list state - it does not filter, group, sort
 * or paginate. Place it in a height-constrained flex parent so the content
 * scrolls.
 * @example
 * <ModelList>
 *   <ModelListHeader>
 *     <ModelListTitle>Model list</ModelListTitle>
 *     <ModelListAction>{search}</ModelListAction>
 *   </ModelListHeader>
 *   <ModelListContent>
 *     <ItemGroup>
 *       <Item size="sm" data-unavailable={unavailable}>
 *         <ItemMedia><AiProviderIcon provider="openai" /></ItemMedia>
 *         <ItemContent><ItemTitle>GPT-4o</ItemTitle><ItemDescription>gpt-4o</ItemDescription></ItemContent>
 *         <ItemActions>
 *           <Switch checked={enabled} disabled={unavailable} onCheckedChange={setEnabled} />
 *           <ModelListItemRemove onClick={remove} />
 *         </ItemActions>
 *       </Item>
 *     </ItemGroup>
 *   </ModelListContent>
 * </ModelList>
 */
function ModelList({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return <div data-slot="model-list" className={cn('flex min-h-0 flex-1 flex-col', className)} {...props} />;
}

/** The row above the list: a title and trailing controls. A `TabsList` placed in it takes a line of its own. */
function ModelListHeader({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-slot="model-list-header"
      className={cn('flex flex-wrap items-center gap-2 px-1 pt-1 *:data-[slot=tabs-list]:basis-full', className)}
      {...props}
    />
  );
}

function ModelListTitle({ className, ...props }: React.ComponentProps<'h3'>): React.ReactNode {
  return (
    <h3
      data-slot="model-list-title"
      className={cn('flex-1 text-base font-semibold tracking-tight', className)}
      {...props}
    />
  );
}

/** Trailing header controls - search, refresh and the like. */
function ModelListAction({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return <div data-slot="model-list-action" className={cn('flex shrink-0 items-center gap-2', className)} {...props} />;
}

/**
 * The scrolling region: item groups, an empty state or a `ModelListSkeleton`.
 * An `Item` inside it with `data-unavailable={true}` is dimmed.
 */
function ModelListContent({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-slot="model-list-content"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-3 **:data-[slot=item]:data-[unavailable=true]:opacity-55',
        className,
      )}
      {...props}
    />
  );
}

/** The remove control for one model item, labelled "Remove model" unless an `aria-label` is given. */
function ModelListItemRemove({ className, children, ...props }: React.ComponentProps<typeof Button>): React.ReactNode {
  return (
    <Button
      data-slot="model-list-item-remove"
      aria-label="Remove model"
      variant="ghost"
      size="icon-sm"
      className={cn('text-muted-foreground hover:text-destructive', className)}
      {...props}
    >
      {children ?? <Trash2 className="size-3.5" />}
    </Button>
  );
}

interface ModelListSkeletonProps extends React.ComponentProps<'div'> {
  /** Number of placeholder items. Defaults to 6. */
  count?: number;
}

/**
 * Placeholder items shown while a model list loads, each the shape of a model
 * item: a media placeholder, two text lines and a trailing control.
 */
function ModelListSkeleton({ count = 6, className, ...props }: ModelListSkeletonProps): React.ReactNode {
  return (
    <div data-slot="model-list-skeleton" className={cn('flex flex-col gap-2', className)} {...props}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} data-slot="model-list-skeleton-item" className="flex items-center gap-3 rounded-lg p-2.5">
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

export {
  ModelList,
  ModelListAction,
  ModelListContent,
  ModelListHeader,
  ModelListItemRemove,
  ModelListSkeleton,
  ModelListTitle,
};
export type { ModelListSkeletonProps };
