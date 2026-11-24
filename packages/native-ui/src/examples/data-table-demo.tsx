import {
  columnVisibilityFeature,
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';

import {
  DataTable,
  DataTablePagination,
  DataTablePaginationNext,
  DataTablePaginationPrevious,
  DataTableToolbar,
  DataTableView,
  DataTableViewOptions,
} from '@/components/data-display/data-table';
import {
  DataTableColumnHeader,
  DataTableColumnHeaderContent,
  DataTableColumnHeaderHide,
  DataTableColumnHeaderSortAscending,
  DataTableColumnHeaderSortDescending,
  DataTableColumnHeaderTrigger,
} from '@/components/data-display/data-table-column-header';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Text } from '@/components/ui/text';

interface FileRow {
  name: string;
  size: string;
}

const DATA: FileRow[] = [
  { name: 'report.pdf', size: '2.4 MB' },
  { name: 'invoice.csv', size: '12 KB' },
  { name: 'logo.png', size: '340 KB' },
];

const FEATURES = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSortingFeature,
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

const COLUMN = createColumnHelper<typeof FEATURES, FileRow>();

const COLUMNS = COLUMN.columns([
  COLUMN.accessor('name', {
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
  }),
  COLUMN.accessor('size', {
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
  }),
]);

/** A small, paginated file table with sortable columns and a view-options menu. */
function DataTableDemo(): ReactNode {
  const table = useTable({
    features: FEATURES,
    data: DATA,
    columns: COLUMNS,
    initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
  });

  return (
    <DataTable table={table} className="w-full">
      <DataTableToolbar className="justify-end">
        <DataTableViewOptions />
      </DataTableToolbar>
      <DataTableView />
      <DataTablePagination>
        <Text className="text-muted-foreground text-sm">
          {`Page ${table.state.pagination.pageIndex + 1} of ${table.getPageCount()}`}
        </Text>
        <DataTablePaginationPrevious aria-label="Previous page" />
        <DataTablePaginationNext aria-label="Next page" />
      </DataTablePagination>
    </DataTable>
  );
}

export { DataTableDemo };
