import * as React from 'react';
import { type Table as TanstackTable, flexRender } from '@tanstack/react-table';
import { Settings2 } from 'lucide-react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { ChevronLeftIcon } from '@/registry/bases/base-ui/ui/chevron-left';
import { ChevronRightIcon } from '@/registry/bases/base-ui/ui/chevron-right';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';
import { Empty } from '@/registry/bases/base-ui/ui/empty';
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
 * The table content (header + body) rendered from the context table instance, in a bordered frame;
 * the `Table` scrolls sideways inside it when the columns are wider than it. `children` render in the
 * body only while there are no rows - a `DataTableEmpty`.
 */
function DataTableView({ children, className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  const table = useDataTable();

  return (
    <div data-slot="data-table-view" className={cn('overflow-hidden rounded-lg border', className)} {...props}>
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
      <TableCell data-slot="data-table-empty" colSpan={table.getAllLeafColumns().length} {...props}>
        <Empty>{children}</Empty>
      </TableCell>
    </TableRow>
  );
}

/**
 * The pager's row, a plain flex row with no context of its own. `children` are its content: a status
 * line such as "Page X of Y" (the consumer's i18n owns that copy) and the step buttons,
 * `DataTablePaginationPrevious` and `DataTablePaginationNext`, which read the table themselves.
 */
function DataTablePagination({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-slot="data-table-pagination"
      className={cn('flex items-center justify-end gap-2', className)}
      {...props}
    />
  );
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
      data-slot="data-table-pagination-previous"
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
      data-slot="data-table-pagination-next"
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
  DataTablePagination,
  DataTablePaginationPrevious,
  DataTablePaginationNext,
  DataTableViewOptions,
};
