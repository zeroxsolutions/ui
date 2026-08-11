import * as React from 'react';

import { Skeleton } from '@/registry/bases/base-ui/ui/skeleton';
import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface ModelListSkeletonProps extends React.ComponentProps<'div'> {
  /** Number of placeholder items. Defaults to 6. */
  count?: number;
}

/**
 * Placeholder items shown while a model list loads. Each mirrors
 * `ModelListItem`'s shape - a leading media placeholder, two stacked text-line
 * placeholders, and a trailing control placeholder - composed from the shipped
 * `Skeleton`. Presentational and domain-free.
 */
function ModelListSkeleton({
  count = 6,
  className,
  ...props
}: ModelListSkeletonProps) {
  return (
    <div
      data-slot="model-list-skeleton"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          data-slot="model-list-skeleton-item"
          className="flex items-center gap-3 rounded-md p-2.5"
        >
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

export { ModelListSkeleton };
