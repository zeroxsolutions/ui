import * as React from 'react';
import { type Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from 'lucide-react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.ComponentProps<'div'> {
  column: Column<TData, TValue>;
}

/**
 * Sortable / hideable header. Used inside a column's `header`, so it takes the
 * `column` directly (column defs live outside the render tree, can't read
 * context). Its title is `children`; the menu shows the default sort/hide
 * actions, whose copy lives as each action part's own `children` default —
 * compose the parts for different copy, never a `labels` config.
 */
function DataTableColumnHeader<TData, TValue>({
  column,
  children,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return (
      <div className={cn(className)} {...props}>
        {children}
      </div>
    );
  }

  const sorted = column.getIsSorted();

  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2.5 data-[popup-open]:bg-accent"
            />
          }
        >
          {children}
          {sorted === 'desc' ? (
            <ArrowDown className="size-3.5" />
          ) : sorted === 'asc' ? (
            <ArrowUp className="size-3.5" />
          ) : (
            <ChevronsUpDown className="size-3.5 opacity-50" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {column.getCanSort() && (
            <>
              <DataTableColumnHeaderSortAscending column={column} />
              <DataTableColumnHeaderSortDescending column={column} />
            </>
          )}
          {column.getCanSort() && column.getCanHide() && (
            <DropdownMenuSeparator />
          )}
          {column.getCanHide() && <DataTableColumnHeaderHide column={column} />}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

type DataTableColumnActionProps<TData, TValue> = {
  column: Column<TData, TValue>;
} & React.ComponentProps<typeof DropdownMenuItem>;

/** Sort-ascending action; `children` override the default copy. */
function DataTableColumnHeaderSortAscending<TData, TValue>({
  column,
  children,
  ...props
}: DataTableColumnActionProps<TData, TValue>) {
  return (
    <DropdownMenuItem {...props} onClick={() => column.toggleSorting(false)}>
      <ArrowUp className="text-muted-foreground/70" />
      {children ?? 'Asc'}
    </DropdownMenuItem>
  );
}

/** Sort-descending action; `children` override the default copy. */
function DataTableColumnHeaderSortDescending<TData, TValue>({
  column,
  children,
  ...props
}: DataTableColumnActionProps<TData, TValue>) {
  return (
    <DropdownMenuItem {...props} onClick={() => column.toggleSorting(true)}>
      <ArrowDown className="text-muted-foreground/70" />
      {children ?? 'Desc'}
    </DropdownMenuItem>
  );
}

/** Hide-column action; `children` override the default copy. */
function DataTableColumnHeaderHide<TData, TValue>({
  column,
  children,
  ...props
}: DataTableColumnActionProps<TData, TValue>) {
  return (
    <DropdownMenuItem {...props} onClick={() => column.toggleVisibility(false)}>
      <EyeOff className="text-muted-foreground/70" />
      {children ?? 'Hide'}
    </DropdownMenuItem>
  );
}

export {
  DataTableColumnHeader,
  DataTableColumnHeaderSortAscending,
  DataTableColumnHeaderSortDescending,
  DataTableColumnHeaderHide,
};
