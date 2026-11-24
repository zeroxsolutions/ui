import * as React from 'react';
import type { Column, RowData, TableFeatures } from '@tanstack/react-table';

import { usePrefersReducedMotion } from '@/registry/bases/base-ui/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { ArrowDownIcon } from '@/registry/bases/base-ui/icons/lucide/arrow-down-icon';
import { ArrowUpIcon } from '@/registry/bases/base-ui/icons/lucide/arrow-up-icon';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { ChevronsUpDownIcon } from '@/registry/bases/base-ui/icons/lucide/chevrons-up-down-icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';
import { EyeOffIcon } from '@/registry/bases/base-ui/icons/lucide/eye-off-icon';

/** What every animated icon here exposes, so the control around it can play it. */
interface DataTableColumnHeaderIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

/** An animated icon component: a ref to its handle, and nothing else it needs from here. */
type DataTableColumnHeaderIcon = React.ComponentType<{
  ref?: React.Ref<DataTableColumnHeaderIconHandle>;
  'aria-hidden'?: boolean;
}>;

interface DataTableColumnHeaderContextValue {
  // One context holds a column of any features, row and value type, and a column type is invariant in each of them.
  column: unknown;
}

const DataTableColumnHeaderContext = React.createContext<DataTableColumnHeaderContextValue | null>(null);

/** The column the surrounding header holds, typed with every feature's APIs; the parts call only sorting and visibility. */
function useDataTableColumnHeader(): { column: Column<TableFeatures, RowData, unknown> } {
  const ctx = React.useContext(DataTableColumnHeaderContext);
  if (!ctx) {
    throw new Error('DataTableColumnHeader parts must be used within <DataTableColumnHeader>');
  }
  return { column: ctx.column as Column<TableFeatures, RowData, unknown> };
}

interface DataTableColumnHeaderProps<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue,
> extends React.ComponentProps<'div'> {
  column: Column<TFeatures, TData, TValue>;
}

/**
 * A column's header, rendered from the column's `header`. It takes the `column` directly, since column
 * defs live outside the render tree, and hands it to its parts, which compose a column menu:
 *
 * ```tsx
 * <DataTableColumnHeader column={column}>
 *   <DataTableColumnHeaderTrigger>Name</DataTableColumnHeaderTrigger>
 *   <DataTableColumnHeaderContent>
 *     <DataTableColumnHeaderSortAscending />
 *     <DataTableColumnHeaderSortDescending />
 *     <DropdownMenuSeparator />
 *     <DataTableColumnHeaderHide />
 *   </DataTableColumnHeaderContent>
 * </DataTableColumnHeader>
 * ```
 *
 * A column that neither sorts nor hides takes its title as plain `children`, with no menu. The sort
 * actions and the trigger's sort icon call `rowSortingFeature`'s APIs and the hide action
 * `columnVisibilityFeature`'s, so the column's table registers the features its menu uses.
 */
function DataTableColumnHeader<TFeatures extends TableFeatures, TData extends RowData, TValue>({
  column,
  className,
  ...props
}: DataTableColumnHeaderProps<TFeatures, TData, TValue>): React.ReactNode {
  const value = React.useMemo(() => ({ column }), [column]);
  return (
    <DataTableColumnHeaderContext.Provider value={value}>
      <DropdownMenu>
        <div data-slot="data-table-column-header" className={cn('flex items-center gap-2', className)} {...props} />
      </DropdownMenu>
    </DataTableColumnHeaderContext.Provider>
  );
}

/**
 * The ghost button that opens the column menu: `children` are the column's title, followed by an
 * icon for the column's sort direction that plays while the button is hovered or focused.
 */
function DataTableColumnHeaderTrigger({
  children,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<typeof DropdownMenuTrigger>): React.ReactNode {
  const { column } = useDataTableColumnHeader();
  const iconRef = React.useRef<DataTableColumnHeaderIconHandle>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const sorted = column.getIsSorted();
  const SortIcon = sorted === 'desc' ? ArrowDownIcon : sorted === 'asc' ? ArrowUpIcon : ChevronsUpDownIcon;

  return (
    // The negative margin lines the button's label up with the column's cells.
    <DropdownMenuTrigger
      data-slot="data-table-column-header-trigger"
      render={<Button variant="ghost" className="-ml-2.5" />}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        if (!prefersReducedMotion) iconRef.current?.startAnimation();
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        if (!prefersReducedMotion) iconRef.current?.stopAnimation();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (!prefersReducedMotion) iconRef.current?.startAnimation();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        if (!prefersReducedMotion) iconRef.current?.stopAnimation();
      }}
      {...props}
    >
      {children}
      <SortIcon ref={iconRef} aria-hidden />
    </DropdownMenuTrigger>
  );
}

/** The column menu, opening from the trigger's start edge; `children` are its actions. */
function DataTableColumnHeaderContent({
  align = 'start',
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>): React.ReactNode {
  return <DropdownMenuContent data-slot="data-table-column-header-content" align={align} {...props} />;
}

/** A column menu item whose leading animated icon plays while the item is hovered or focused. */
function DataTableColumnHeaderAction({
  icon: Icon,
  children,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<typeof DropdownMenuItem> & { icon: DataTableColumnHeaderIcon }): React.ReactNode {
  const iconRef = React.useRef<DataTableColumnHeaderIconHandle>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  return (
    <DropdownMenuItem
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        if (!prefersReducedMotion) iconRef.current?.startAnimation();
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        if (!prefersReducedMotion) iconRef.current?.stopAnimation();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (!prefersReducedMotion) iconRef.current?.startAnimation();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        if (!prefersReducedMotion) iconRef.current?.stopAnimation();
      }}
      {...props}
    >
      <Icon ref={iconRef} aria-hidden />
      {children}
    </DropdownMenuItem>
  );
}

/**
 * Sorts the header's column ascending; `children` override the default copy. A caller's `onClick`
 * runs first, and calling `event.preventDefault()` in it skips the sort.
 */
function DataTableColumnHeaderSortAscending({
  children,
  onClick,
  ...props
}: React.ComponentProps<typeof DropdownMenuItem>): React.ReactNode {
  const { column } = useDataTableColumnHeader();
  return (
    <DataTableColumnHeaderAction
      data-slot="data-table-column-header-sort-ascending"
      icon={ArrowUpIcon}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) column.toggleSorting(false);
      }}
      {...props}
    >
      {children ?? 'Asc'}
    </DataTableColumnHeaderAction>
  );
}

/**
 * Sorts the header's column descending; `children` override the default copy. A caller's `onClick`
 * runs first, and calling `event.preventDefault()` in it skips the sort.
 */
function DataTableColumnHeaderSortDescending({
  children,
  onClick,
  ...props
}: React.ComponentProps<typeof DropdownMenuItem>): React.ReactNode {
  const { column } = useDataTableColumnHeader();
  return (
    <DataTableColumnHeaderAction
      data-slot="data-table-column-header-sort-descending"
      icon={ArrowDownIcon}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) column.toggleSorting(true);
      }}
      {...props}
    >
      {children ?? 'Desc'}
    </DataTableColumnHeaderAction>
  );
}

/**
 * Hides the header's column; `children` override the default copy. A caller's `onClick` runs first,
 * and calling `event.preventDefault()` in it skips the hide.
 */
function DataTableColumnHeaderHide({
  children,
  onClick,
  ...props
}: React.ComponentProps<typeof DropdownMenuItem>): React.ReactNode {
  const { column } = useDataTableColumnHeader();
  return (
    <DataTableColumnHeaderAction
      data-slot="data-table-column-header-hide"
      icon={EyeOffIcon}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) column.toggleVisibility(false);
      }}
      {...props}
    >
      {children ?? 'Hide'}
    </DataTableColumnHeaderAction>
  );
}

export {
  DataTableColumnHeader,
  DataTableColumnHeaderTrigger,
  DataTableColumnHeaderContent,
  DataTableColumnHeaderSortAscending,
  DataTableColumnHeaderSortDescending,
  DataTableColumnHeaderHide,
};
