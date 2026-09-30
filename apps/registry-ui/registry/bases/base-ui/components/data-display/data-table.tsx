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
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';
import { Empty } from '@/registry/bases/base-ui/ui/empty';
import { EyeOffIcon } from '@/registry/bases/base-ui/ui/eye-off';
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
      <div className={cn('space-y-2', className)} {...props}>
        {children}
      </div>
    </DataTableContext.Provider>
  );
}

/** A flex row for filters + actions above the table. */
function DataTableToolbar({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return <div className={cn('flex items-center gap-2', className)} {...props} />;
}

/**
 * The table content (header + body) rendered from the context table instance, in a bordered frame;
 * the `Table` scrolls sideways inside it when the columns are wider than it. `children` render in the
 * body only while there are no rows - a `DataTableEmpty`.
 */
function DataTableView({ children, className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  const table = useDataTable();

  return (
    <div className={cn('overflow-hidden rounded-lg border', className)} {...props}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead key={header.id} colSpan={header.colSpan}>
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

/**
 * The one row a `DataTableView` shows when there are no rows: a cell spanning
 * every column, its `children` centred in an upstream `Empty`. Every other prop
 * goes to the cell. The cell keeps `TableCell`'s `whitespace-nowrap`, so a long
 * message widens the table rather than wrapping; keep it short.
 */
function DataTableEmpty({ children, ...props }: React.ComponentProps<typeof TableCell>): React.ReactNode {
  const table = useDataTable();
  return (
    <TableRow>
      <TableCell colSpan={table.getAllLeafColumns().length} {...props}>
        <Empty>{children}</Empty>
      </TableCell>
    </TableRow>
  );
}

interface DataTableColumnHeaderContextValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- one context holds a column of any row and value type
  column: Column<any, any>;
}

const DataTableColumnHeaderContext = React.createContext<DataTableColumnHeaderContextValue | null>(null);

function useDataTableColumnHeader(): DataTableColumnHeaderContextValue {
  const ctx = React.useContext(DataTableColumnHeaderContext);
  if (!ctx) {
    throw new Error('DataTableColumnHeader parts must be used within <DataTableColumnHeader>');
  }
  return ctx;
}

interface DataTableColumnHeaderProps<TData, TValue> extends React.ComponentProps<'div'> {
  column: Column<TData, TValue>;
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
 * A column that neither sorts nor hides takes its title as plain `children`, with no menu.
 */
function DataTableColumnHeader<TData, TValue>({
  column,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>): React.ReactNode {
  const value = React.useMemo(() => ({ column }), [column]);
  return (
    <DataTableColumnHeaderContext.Provider value={value}>
      <DropdownMenu>
        <div className={cn('flex items-center gap-2', className)} {...props} />
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
  const iconRef = React.useRef<DataTableIconHandle>(null);
  const sorted = column.getIsSorted();
  const SortIcon = sorted === 'desc' ? ArrowDownIcon : sorted === 'asc' ? ArrowUpIcon : ChevronsUpDownIcon;

  return (
    // The negative margin lines the button's label up with the column's cells.
    <DropdownMenuTrigger
      render={<Button variant="ghost" size="sm" className="-ml-2.5" />}
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
  return <DropdownMenuContent align={align} {...props} />;
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

/**
 * The pager's row, reading the table from <DataTable> context. `children` are its content: a status
 * line such as "Page X of Y" (the consumer's i18n owns that copy) and the step buttons,
 * `DataTablePaginationPrevious` and `DataTablePaginationNext`.
 */
function DataTablePagination({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return <div className={cn('flex items-center justify-end gap-2', className)} {...props} />;
}

type DataTablePaginationStepProps = Omit<React.ComponentProps<typeof Button>, 'children'> & {
  /** The icon-only button's accessible name, such as "Previous page". */
  'aria-label': string;
};

/** An outline icon button that steps the pager, its animated chevron playing while it is hovered or focused. */
function DataTablePaginationStep({
  icon: Icon,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: DataTablePaginationStepProps & { icon: DataTableIcon }): React.ReactNode {
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

/** Steps the table back one page, disabled on the first; the caller names it with `aria-label`. */
function DataTablePaginationPrevious(props: DataTablePaginationStepProps): React.ReactNode {
  const table = useDataTable();
  return (
    <DataTablePaginationStep
      icon={ChevronLeftIcon}
      onClick={() => table.previousPage()}
      disabled={!table.getCanPreviousPage()}
      {...props}
    />
  );
}

/** Steps the table on one page, disabled on the last; the caller names it with `aria-label`. */
function DataTablePaginationNext(props: DataTablePaginationStepProps): React.ReactNode {
  const table = useDataTable();
  return (
    <DataTablePaginationStep
      icon={ChevronRightIcon}
      onClick={() => table.nextPage()}
      disabled={!table.getCanNextPage()}
      {...props}
    />
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
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" aria-label="Toggle columns" {...props} />}>
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
  DataTableColumnHeaderTrigger,
  DataTableColumnHeaderContent,
  DataTableColumnHeaderSortAscending,
  DataTableColumnHeaderSortDescending,
  DataTableColumnHeaderHide,
  DataTablePagination,
  DataTablePaginationPrevious,
  DataTablePaginationNext,
  DataTableViewOptions,
};
