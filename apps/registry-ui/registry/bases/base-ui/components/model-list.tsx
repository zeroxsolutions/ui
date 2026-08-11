import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface ModelListProps
  extends Omit<React.ComponentProps<'div'>, 'title'> {
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
function ModelList({
  title,
  controls,
  tabs,
  children,
  className,
  ...props
}: ModelListProps) {
  return (
    <div
      data-slot="model-list"
      className={cn('flex min-h-0 flex-1 flex-col', className)}
      {...props}
    >
      <div className="flex flex-col gap-2 px-1 pt-1">
        <div className="flex items-center justify-between gap-2">
          {title != null && (
            <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          )}
          {controls != null && (
            <div className="flex shrink-0 items-center gap-2">{controls}</div>
          )}
        </div>
        {tabs}
      </div>
      <div
        data-slot="model-list-content"
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="flex flex-col gap-4 py-3">{children}</div>
      </div>
    </div>
  );
}

export { ModelList };
