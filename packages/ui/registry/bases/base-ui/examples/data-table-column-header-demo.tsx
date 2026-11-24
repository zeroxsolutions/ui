'use client';

import {
  columnVisibilityFeature,
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';

import {
  DataTableColumnHeader,
  DataTableColumnHeaderContent,
  DataTableColumnHeaderHide,
  DataTableColumnHeaderSortAscending,
  DataTableColumnHeaderSortDescending,
  DataTableColumnHeaderTrigger,
} from '@/registry/bases/base-ui/components/data-display/data-table-column-header';
import { DropdownMenuSeparator } from '@/registry/bases/base-ui/ui/dropdown-menu';
import { Table, TableHead, TableHeader, TableRow } from '@/registry/bases/base-ui/ui/table';

interface FileRow {
  name: string;
  size: string;
}

const FEATURES = tableFeatures({
  columnVisibilityFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

const COLUMN = createColumnHelper<typeof FEATURES, FileRow>();

const COLUMNS = COLUMN.columns([
  COLUMN.accessor('name', { header: 'Name' }),
  COLUMN.accessor('size', { header: 'Size' }),
]);

const DATA: FileRow[] = [];

/** A table's header row, its "Name" column opening a sort-and-hide menu from the column header. */
function DataTableColumnHeaderDemo(): ReactNode {
  const table = useTable({ features: FEATURES, data: DATA, columns: COLUMNS });
  const column = table.getColumn('name');

  return (
    <Table className="w-full max-w-sm">
      <TableHeader>
        <TableRow>
          <TableHead>
            {column && (
              <DataTableColumnHeader column={column}>
                <DataTableColumnHeaderTrigger>Name</DataTableColumnHeaderTrigger>
                <DataTableColumnHeaderContent>
                  <DataTableColumnHeaderSortAscending />
                  <DataTableColumnHeaderSortDescending />
                  <DropdownMenuSeparator />
                  <DataTableColumnHeaderHide />
                </DataTableColumnHeaderContent>
              </DataTableColumnHeader>
            )}
          </TableHead>
          <TableHead>Size</TableHead>
        </TableRow>
      </TableHeader>
    </Table>
  );
}

export { DataTableColumnHeaderDemo };
