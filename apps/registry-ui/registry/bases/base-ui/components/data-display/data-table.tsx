import * as React from 'react';
import { type Column, type Table as TanstackTable, flexRender } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/bases/base-ui/ui/table';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, EyeOff, Settings2 } from 'lucide-react';
import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';

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
 * The table content (header + body) rendered from the context table instance.
 * `children` render in the body only while there are no rows - a `DataTableEmpty`.
 */
function DataTableView({ children, className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  const table = useDataTable();

  return (
    <div data-slot="data-table-view" className={cn('rounded-md border', className)} {...props}>
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
    </div>
  );
}

/** The one row a `DataTableView` shows when there are no rows: a cell spanning every column. */
function DataTableEmpty({ className, ...props }: React.ComponentProps<typeof TableCell>): React.ReactNode {
  const table = useDataTable();
  return (
    <TableRow>
      <TableCell
        data-slot="data-table-empty"
        colSpan={table.getAllLeafColumns().length}
        className={cn('h-24 text-center', className)}
        {...props}
      />
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
  if (!column.getCanSort() && !column.getCanHide()) {
    return (
      <div data-slot="data-table-column-header" className={cn(className)} {...props}>
        {children}
      </div>
    );
  }

  const sorted = column.getIsSorted();

  return (
    <div data-slot="data-table-column-header" className={cn('flex items-center gap-2', className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="sm" className="data-[popup-open]:bg-accent -ml-2.5" />}
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

/** Sort-ascending action; `children` override the default copy. A caller's `onClick` runs before the sort. */
function DataTableColumnHeaderSortAscending<TData, TValue>({
  column,
  children,
  onClick,
  ...props
}: DataTableColumnActionProps<TData, TValue>): React.ReactNode {
  return (
    <DropdownMenuItem
      data-slot="data-table-column-header-sort-ascending"
      onClick={(event) => {
        onClick?.(event);
        column.toggleSorting(false);
      }}
      {...props}
    >
      <ArrowUp className="text-muted-foreground/70" />
      {children ?? 'Asc'}
    </DropdownMenuItem>
  );
}

/** Sort-descending action; `children` override the default copy. A caller's `onClick` runs before the sort. */
function DataTableColumnHeaderSortDescending<TData, TValue>({
  column,
  children,
  onClick,
  ...props
}: DataTableColumnActionProps<TData, TValue>): React.ReactNode {
  return (
    <DropdownMenuItem
      data-slot="data-table-column-header-sort-descending"
      onClick={(event) => {
        onClick?.(event);
        column.toggleSorting(true);
      }}
      {...props}
    >
      <ArrowDown className="text-muted-foreground/70" />
      {children ?? 'Desc'}
    </DropdownMenuItem>
  );
}

/** Hide-column action; `children` override the default copy. A caller's `onClick` runs before the column hides. */
function DataTableColumnHeaderHide<TData, TValue>({
  column,
  children,
  onClick,
  ...props
}: DataTableColumnActionProps<TData, TValue>): React.ReactNode {
  return (
    <DropdownMenuItem
      data-slot="data-table-column-header-hide"
      onClick={(event) => {
        onClick?.(event);
        column.toggleVisibility(false);
      }}
      {...props}
    >
      <EyeOff className="text-muted-foreground/70" />
      {children ?? 'Hide'}
    </DropdownMenuItem>
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
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
        aria-label={previousLabel}
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
        aria-label={nextLabel}
      >
        <ChevronRight />
      </Button>
    </div>
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
