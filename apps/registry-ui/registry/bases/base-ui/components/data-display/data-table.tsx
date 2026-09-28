import * as React from 'react';
import { flexRender, type Table as TanstackTable } from '@tanstack/react-table';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/bases/base-ui/ui/table';
import { cn } from '@/registry/bases/base-ui/lib/utils';

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

export { DataTable, DataTableToolbar, DataTableView, useDataTable };
