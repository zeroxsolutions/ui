import { getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import type { ReactNode } from 'react';

import {
  DataTableColumnHeader,
  DataTableColumnHeaderContent,
  DataTableColumnHeaderHide,
  DataTableColumnHeaderSortAscending,
  DataTableColumnHeaderSortDescending,
  DataTableColumnHeaderTrigger,
} from '@/components/data-display/data-table-column-header';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Text } from '@/components/ui/text';

interface FileRow {
  name: string;
  size: string;
}

const COLUMNS: ColumnDef<FileRow>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'size', header: 'Size' },
];

/** A table's header row, its "Name" column opening a sort-and-hide menu from the column header. */
function DataTableColumnHeaderDemo(): ReactNode {
  const table = useReactTable({
    data: [],
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  const column = table.getColumn('name');

  return (
    <Table className="w-full max-w-sm">
      <TableHeader>
        <TableRow>
          <TableHead>
            {column?.getIsVisible() && (
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
          <TableHead>
            <Text>Size</Text>
          </TableHead>
        </TableRow>
      </TableHeader>
    </Table>
  );
}

export { DataTableColumnHeaderDemo };
