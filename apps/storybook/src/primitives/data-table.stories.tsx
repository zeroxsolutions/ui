import * as React from 'react';
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

import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableToolbar,
  DataTableView,
  DataTableViewOptions,
  Empty,
  EmptyHeader,
  EmptyTitle,
  Input,
} from '@chiselart/ui';

type Person = { name: string; role: string; email: string };

const data: Person[] = [
  { name: 'Ada Lovelace', role: 'Engineer', email: 'ada@chiselart.dev' },
  { name: 'Alan Turing', role: 'Researcher', email: 'alan@chiselart.dev' },
  { name: 'Grace Hopper', role: 'Admiral', email: 'grace@chiselart.dev' },
  { name: 'Katherine Johnson', role: 'Mathematician', email: 'kj@chiselart.dev' },
  { name: 'Margaret Hamilton', role: 'Engineer', email: 'mh@chiselart.dev' },
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

const meta: Meta = {
  title: 'Components/DataTable',
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
