import * as React from 'react';
import { type Column, type Table as TanstackTable, flexRender } from '@tanstack/react-table';
import { Settings2 } from 'lucide-react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { ArrowDownIcon } from '@/registry/bases/base-ui/ui/arrow-down';
import { ArrowUpIcon } from '@/registry/bases/base-ui/ui/arrow-up';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { ChevronLeftIcon } from '@/registry/bases/base-ui/ui/chevron-left';
import { ChevronRightIcon } from '@/registry/bases/base-ui/ui/chevron-right';
import { ChevronsUpDownIcon } from '@/registry/bases/base-ui/ui/chevrons-up-down';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';
import { Empty } from '@/registry/bases/base-ui/ui/empty';
import { EyeOffIcon } from '@/registry/bases/base-ui/ui/eye-off';
import { ScrollArea, ScrollBar } from '@/registry/bases/base-ui/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/bases/base-ui/ui/table';

/** What every animated icon here exposes, so the control around it can play it. */
interface DataTableIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

/** An animated icon component: a ref to its handle, and nothing else it needs from here. */
type DataTableIcon = React.ComponentType<{ ref?: React.Ref<DataTableIconHandle>; 'aria-hidden'?: boolean }>;

interface DataTableContextValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- one context holds a table of any row type; useDataTable narrows it
  table: TanstackTable<any>;
}

const DataTableContext = React.createContext<DataTableContextValue | null>(null);

/** Read the @tanstack/react-table instance shared by the surrounding <DataTable>. */
function useDataTable<TData>(): TanstackTable<TData> {
  const ctx = React.useContext(DataTableContext);
  if (!ctx) {
    throw new Error('DataTable parts must be used within <DataTable>');
  }
  return ctx.table as TanstackTable<TData>;
}

interface DataTableProps<TData> extends React.ComponentProps<'div'> {
  table: TanstackTable<TData>;
}

/**
 * Root of the data-table compound. Holds the table instance in context so every
 * part (toolbar, view, view-options, pagination) reads it without prop-drilling.
 * The consumer owns `useReactTable` + the column defs; the SDK ships only the
 * composable parts (shadcn data-table is a recipe, not a packaged component).
 */
function DataTable<TData>({ table, className, children, ...props }: DataTableProps<TData>): React.ReactNode {
  const value = React.useMemo(() => ({ table }), [table]);
  return (
    <DataTableContext.Provider value={value}>
      <div data-slot="data-table" className={cn('space-y-2', className)} {...props}>
        {children}
      </div>
    </DataTableContext.Provider>
  );
}

/** A flex row for filters + actions above the table. */
function DataTableToolbar({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return <div data-slot="data-table-toolbar" className={cn('flex items-center gap-2', className)} {...props} />;
}

/**
 * The table content (header + body) rendered from the context table instance, in
 * a bordered frame that scrolls sideways in a `ScrollArea` when the columns are
 * wider than it. `children` render in the body only while there are no rows - a
 * `DataTableEmpty`.
 */
function DataTableView({ children, className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  const table = useDataTable();

  return (
    <div data-slot="data-table-view" className={cn('overflow-hidden rounded-lg border', className)} {...props}>
      {/* The Table primitive wraps itself in an overflow-x-auto box; letting it overflow hands the scroll to the ScrollArea. */}
      <ScrollArea className="**:data-[slot=table-container]:overflow-visible">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length
              ? table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              : children}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

/**
 * The one row a `DataTableView` shows when there are no rows: a cell spanning
 * every column, its `children` centred in an upstream `Empty`. Every other prop
 * goes to the cell.
 */
function DataTableEmpty({ children, ...props }: React.ComponentProps<typeof TableCell>): React.ReactNode {
  const table = useDataTable();
  return (
    <TableRow>
      <TableCell data-slot="data-table-empty" colSpan={table.getAllLeafColumns().length} {...props}>
        <Empty>{children}</Empty>
      </TableCell>
    </TableRow>
  );
}

interface DataTableColumnHeaderProps<TData, TValue> extends React.ComponentProps<'div'> {
  column: Column<TData, TValue>;
}

/**
 * Sortable / hideable header. Used inside a column's `header`, so it takes the
 * `column` directly (column defs live outside the render tree, can't read
 * context). Its title is `children`; the menu shows the default sort/hide
 * actions, whose copy lives as each action part's own `children` default -
 * compose the parts for different copy, never a `labels` config.
 */
function DataTableColumnHeader<TData, TValue>({
  column,
  children,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>): React.ReactNode {
  const iconRef = React.useRef<DataTableIconHandle>(null);

  if (!column.getCanSort() && !column.getCanHide()) {
    return (
      <div data-slot="data-table-column-header" className={className} {...props}>
        {children}
      </div>
    );
  }

  const sorted = column.getIsSorted();
  const SortIcon = sorted === 'desc' ? ArrowDownIcon : sorted === 'asc' ? ArrowUpIcon : ChevronsUpDownIcon;

  return (
    <div data-slot="data-table-column-header" className={cn('flex items-center gap-2', className)} {...props}>
      <DropdownMenu>
        {/* The negative margin lines the button's label up with the column's cells. */}
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="sm" className="-ml-2.5" />}
          onMouseEnter={() => iconRef.current?.startAnimation()}
          onMouseLeave={() => iconRef.current?.stopAnimation()}
          onFocus={() => iconRef.current?.startAnimation()}
          onBlur={() => iconRef.current?.stopAnimation()}
        >
          {children}
          <SortIcon ref={iconRef} aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {column.getCanSort() && (
            <>
              <DataTableColumnHeaderSortAscending column={column} />
              <DataTableColumnHeaderSortDescending column={column} />
            </>
          )}
          {column.getCanSort() && column.getCanHide() && <DropdownMenuSeparator />}
          {column.getCanHide() && <DataTableColumnHeaderHide column={column} />}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

type DataTableColumnActionProps<TData, TValue> = {
  column: Column<TData, TValue>;
} & React.ComponentProps<typeof DropdownMenuItem>;

/** A column menu item whose leading animated icon plays while the item is hovered or focused. */
function DataTableColumnHeaderAction({
  icon: Icon,
  children,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<typeof DropdownMenuItem> & { icon: DataTableIcon }): React.ReactNode {
  const iconRef = React.useRef<DataTableIconHandle>(null);
  return (
    <DropdownMenuItem
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        iconRef.current?.startAnimation();
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        iconRef.current?.stopAnimation();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        iconRef.current?.startAnimation();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        iconRef.current?.stopAnimation();
      }}
      {...props}
    >
      <Icon ref={iconRef} aria-hidden />
      {children}
    </DropdownMenuItem>
  );
}

/**
 * Sort-ascending action; `children` override the default copy. A caller's
 * `onClick` runs first, and calling `event.preventDefault()` in it skips the sort.
 */
function DataTableColumnHeaderSortAscending<TData, TValue>({
  column,
  children,
  onClick,
  ...props
}: DataTableColumnActionProps<TData, TValue>): React.ReactNode {
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
 * Sort-descending action; `children` override the default copy. A caller's
 * `onClick` runs first, and calling `event.preventDefault()` in it skips the sort.
 */
function DataTableColumnHeaderSortDescending<TData, TValue>({
  column,
  children,
  onClick,
  ...props
}: DataTableColumnActionProps<TData, TValue>): React.ReactNode {
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
 * Hide-column action; `children` override the default copy. A caller's
 * `onClick` runs first, and calling `event.preventDefault()` in it skips the hide.
 */
function DataTableColumnHeaderHide<TData, TValue>({
  column,
  children,
  onClick,
  ...props
}: DataTableColumnActionProps<TData, TValue>): React.ReactNode {
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

interface DataTablePaginationProps extends React.ComponentProps<'div'> {
  /** Accessible names for the icon-only buttons (override per locale). */
  previousLabel?: string;
  nextLabel?: string;
}

/**
 * Prev/next pager reading the table from <DataTable> context. Pass children for
 * a status line - the consumer's i18n owns "Page X of Y" - and the icon-only
 * buttons take overridable accessible names.
 */
function DataTablePagination({
  children,
  className,
  previousLabel = 'Previous page',
  nextLabel = 'Next page',
  ...props
}: DataTablePaginationProps): React.ReactNode {
  const table = useDataTable();
  return (
    <div data-slot="data-table-pagination" className={cn('flex items-center justify-end gap-2', className)} {...props}>
      {children}
      <DataTablePaginationStep
        icon={ChevronLeftIcon}
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
        aria-label={previousLabel}
      />
      <DataTablePaginationStep
        icon={ChevronRightIcon}
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
        aria-label={nextLabel}
      />
    </div>
  );
}

/** An outline icon button that steps the pager, its animated chevron playing while it is hovered or focused. */
function DataTablePaginationStep({
  icon: Icon,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'children'> & { icon: DataTableIcon }): React.ReactNode {
  const iconRef = React.useRef<DataTableIconHandle>(null);
  return (
    <Button
      variant="outline"
      size="icon-sm"
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        iconRef.current?.startAnimation();
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        iconRef.current?.stopAnimation();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        iconRef.current?.startAnimation();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        iconRef.current?.stopAnimation();
      }}
      {...props}
    >
      <Icon ref={iconRef} aria-hidden />
    </Button>
  );
}

/**
 * Column-visibility toggle, reading the table from <DataTable> context. The
 * trigger is icon-only by default - pass children to add a visible label (the
 * consumer's i18n owns that copy) - and is named "Toggle columns" unless an
 * `aria-label` is given. No "Toggle columns" heading: the checkbox list speaks
 * for itself, matching shadcn.
 */
function DataTableViewOptions({ children, ...props }: React.ComponentProps<typeof Button>): React.ReactNode {
  const table = useDataTable();
  const columns = table
    .getAllColumns()
    .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide());

  if (columns.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            data-slot="data-table-view-options"
            variant="outline"
            size="sm"
            aria-label="Toggle columns"
            {...props}
          />
        }
      >
        <Settings2 />
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="capitalize"
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}
          >
            {column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export {
  DataTable,
  DataTableToolbar,
  DataTableView,
  DataTableEmpty,
  useDataTable,
  DataTableColumnHeader,
  DataTableColumnHeaderSortAscending,
  DataTableColumnHeaderSortDescending,
  DataTableColumnHeaderHide,
  DataTablePagination,
  DataTableViewOptions,
};
