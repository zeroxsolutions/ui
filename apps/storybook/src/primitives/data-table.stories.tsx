import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';

import {
  DataTable,
  DataTableToolbar,
  DataTableView,
} from '@zeroxsolutions/ui/data-table';
import { DataTableColumnHeader } from '@zeroxsolutions/ui/data-table-column-header';
import { DataTablePagination } from '@zeroxsolutions/ui/data-table-pagination';
import { DataTableViewOptions } from '@zeroxsolutions/ui/data-table-view-options';
import { Empty, EmptyHeader, EmptyTitle } from '@zeroxsolutions/ui/empty';
import { Input } from '@zeroxsolutions/ui/input';

type Person = { name: string; role: string; email: string };

const data: Person[] = [
  { name: 'Ada Lovelace', role: 'Engineer', email: 'ada@example.com' },
  { name: 'Alan Turing', role: 'Researcher', email: 'alan@example.com' },
  { name: 'Grace Hopper', role: 'Admiral', email: 'grace@example.com' },
  {
    name: 'Katherine Johnson',
    role: 'Mathematician',
    email: 'kj@example.com',
  },
  {
    name: 'Margaret Hamilton',
    role: 'Engineer',
    email: 'mh@example.com',
  },
];

const columns: ColumnDef<Person>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column}>Name</DataTableColumnHeader>
    ),
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column}>Role</DataTableColumnHeader>
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column}>Email</DataTableColumnHeader>
    ),
  },
];

/**
 * `DataTable` is a compound recipe that wraps a TanStack Table instance and
 * shares it through context, so its parts — toolbar, view, view options, and
 * pagination — read the same table without prop drilling. The consumer owns
 * `useReactTable` plus the column definitions; these stories only compose the
 * parts around that instance. All visible copy (filter placeholder, empty
 * state, status line) is passed as children, leaving i18n to the host app.
 */
const meta: Meta = {
  title: 'Primitives/DataTable',
};
export default meta;

type Story = StoryObj;

/**
 * Compound recipe: <DataTable> shares the table instance via context; the parts
 * read it. Visible copy is the consumer's — trigger label via children, empty
 * state + status line as slots — so the app's i18n owns it. The SDK ships no
 * baked display strings.
 */
export const Recipe: Story = {
  render: () => {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] =
      React.useState<VisibilityState>({});
    const [globalFilter, setGlobalFilter] = React.useState('');

    const table = useReactTable({
      data,
      columns,
      state: { sorting, columnVisibility, globalFilter },
      onSortingChange: setSorting,
      onColumnVisibilityChange: setColumnVisibility,
      onGlobalFilterChange: setGlobalFilter,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      initialState: { pagination: { pageSize: 3 } },
    });

    return (
      <div className="w-[640px]">
        <DataTable table={table}>
          <DataTableToolbar>
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Filter…"
              className="h-8 max-w-xs"
            />
            <div className="ml-auto">
              <DataTableViewOptions>Columns</DataTableViewOptions>
            </div>
          </DataTableToolbar>

          <DataTableView
            empty={
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No results</EmptyTitle>
                </EmptyHeader>
              </Empty>
            }
          />

          <DataTablePagination>
            <span className="text-sm text-muted-foreground tabular-nums">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount() || 1}
            </span>
          </DataTablePagination>
        </DataTable>
      </div>
    );
  },
};
