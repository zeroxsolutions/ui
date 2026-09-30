'use client';

import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';

import {
  DataTable,
  DataTableColumnHeader,
  DataTableColumnHeaderContent,
  DataTableColumnHeaderHide,
  DataTableColumnHeaderSortAscending,
  DataTableColumnHeaderSortDescending,
  DataTableColumnHeaderTrigger,
  DataTablePagination,
  DataTablePaginationNext,
  DataTablePaginationPrevious,
  DataTableToolbar,
  DataTableView,
  DataTableViewOptions,
} from '@/registry/bases/base-ui/components/data-display/data-table';
import { DropdownMenuSeparator } from '@/registry/bases/base-ui/ui/dropdown-menu';

interface FileRow {
  name: string;
  size: string;
}

const DATA: FileRow[] = [
  { name: 'report.pdf', size: '2.4 MB' },
  { name: 'invoice.csv', size: '12 KB' },
  { name: 'logo.png', size: '340 KB' },
];

const COLUMNS: ColumnDef<FileRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column}>
        <DataTableColumnHeaderTrigger>Name</DataTableColumnHeaderTrigger>
        <DataTableColumnHeaderContent>
          <DataTableColumnHeaderSortAscending />
          <DataTableColumnHeaderSortDescending />
          <DropdownMenuSeparator />
          <DataTableColumnHeaderHide />
        </DataTableColumnHeaderContent>
      </DataTableColumnHeader>
    ),
  },
  {
    accessorKey: 'size',
    header: ({ column }) => (
      <DataTableColumnHeader column={column}>
        <DataTableColumnHeaderTrigger>Size</DataTableColumnHeaderTrigger>
        <DataTableColumnHeaderContent>
          <DataTableColumnHeaderSortAscending />
          <DataTableColumnHeaderSortDescending />
          <DropdownMenuSeparator />
          <DataTableColumnHeaderHide />
        </DataTableColumnHeaderContent>
      </DataTableColumnHeader>
    ),
  },
];

/** A small, paginated file table with sortable columns and a view-options menu. */
function DataTableDemo(): ReactNode {
  const table = useReactTable({
    data: DATA,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 2 } },
  });

  return (
    <DataTable table={table} className="w-full">
      <DataTableToolbar className="justify-end">
        <DataTableViewOptions />
      </DataTableToolbar>
      <DataTableView />
      <DataTablePagination>
        <span className="text-muted-foreground text-sm">
          {`Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}
        </span>
        <DataTablePaginationPrevious aria-label="Previous page" />
        <DataTablePaginationNext aria-label="Next page" />
      </DataTablePagination>
    </DataTable>
  );
}

export { DataTableDemo };
