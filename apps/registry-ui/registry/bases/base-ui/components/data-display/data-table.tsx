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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
function DataTable<TData>({ table, className, children, ...props }: DataTableProps<TData>) {
  const value = React.useMemo(() => ({ table }), [table]);
  return (
    <DataTableContext.Provider value={value}>
      <div className={cn('space-y-2', className)} {...props}>
        {children}
      </div>
    </DataTableContext.Provider>
  );
}

/** A flex row for filters + actions above the table. */
function DataTableToolbar({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex items-center gap-2', className)} {...props} />;
}

interface DataTableViewProps extends React.ComponentProps<'div'> {
  /** Rendered spanning all columns when there are no rows — consumer copy. */
  empty?: React.ReactNode;
}

/** The table content (header + body) rendered from the context table instance. */
function DataTableView({ empty = null, className, ...props }: DataTableViewProps) {
  const table = useDataTable();
  const colSpan = table.getAllLeafColumns().length;

  return (
    <div className={cn('rounded-md border', className)} {...props}>
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
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={colSpan}>{empty}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

interface DataTableColumnHeaderProps<TData, TValue> extends React.ComponentProps<'div'> {
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

interface DataTablePaginationProps {
  /** Status line (e.g. a localized "Page 1 of 3"); omit to hide it. */
  children?: React.ReactNode;
  className?: string;
  /** Accessible names for the icon-only buttons (override per locale). */
  previousLabel?: string;
  nextLabel?: string;
}

/**
 * Prev/next pager reading the table from <DataTable> context. Pass children for
 * a status line — the consumer's i18n owns "Page X of Y" — and the icon-only
 * buttons take overridable accessible names.
 */
function DataTablePagination({
  children,
  className,
  previousLabel = 'Previous page',
  nextLabel = 'Next page',
}: DataTablePaginationProps) {
  const table = useDataTable();
  return (
    <div className={cn('flex items-center justify-end gap-2', className)}>
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

interface DataTableViewOptionsProps {
  /** Trigger label next to the icon; omit for an icon-only trigger. */
  children?: React.ReactNode;
  className?: string;
  /** Accessible name for the trigger (override per locale). */
  'aria-label'?: string;
}

/**
 * Column-visibility toggle, reading the table from <DataTable> context. The
 * trigger is icon-only by default — pass children to add a visible label (the
 * consumer's i18n owns that copy). No "Toggle columns" heading: the checkbox
 * list speaks for itself, matching shadcn.
 */
function DataTableViewOptions({
  children,
  className,
  'aria-label': ariaLabel = 'Toggle columns',
}: DataTableViewOptionsProps) {
  const table = useDataTable();
  const columns = table
    .getAllColumns()
    .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide());

  if (columns.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className={className} aria-label={ariaLabel} />}>
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
  useDataTable,
  DataTableColumnHeader,
  DataTableColumnHeaderSortAscending,
  DataTableColumnHeaderSortDescending,
  DataTableColumnHeaderHide,
  DataTablePagination,
  DataTableViewOptions,
};
