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
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

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

/**
 * A table's header row, each column opening a sort-and-hide menu from its header. Every file has a name, so the
 * "Name" column's Hide keeps the column and says why instead.
 */
function DataTableColumnHeaderDemo(): ReactNode {
  const table = useTable({ features: FEATURES, data: DATA, columns: COLUMNS });
  const [hint, setHint] = useState<string | null>(null);
  const name = table.getColumn('name');
  const size = table.getColumn('size');

  return (
    <View className="w-full max-w-sm gap-2">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead>
              {name?.getIsVisible() && (
                <DataTableColumnHeader column={name}>
                  <DataTableColumnHeaderTrigger>Name</DataTableColumnHeaderTrigger>
                  <DataTableColumnHeaderContent>
                    <DataTableColumnHeaderSortAscending />
                    <DataTableColumnHeaderSortDescending />
                    <DropdownMenuSeparator />
                    <DataTableColumnHeaderHide
                      onPress={(event) => {
                        event.preventDefault();
                        setHint('Every file has a name, so this column stays');
                      }}
                    />
                  </DataTableColumnHeaderContent>
                </DataTableColumnHeader>
              )}
            </TableHead>
            <TableHead>
              {size?.getIsVisible() && (
                <DataTableColumnHeader column={size}>
                  <DataTableColumnHeaderTrigger>Size</DataTableColumnHeaderTrigger>
                  <DataTableColumnHeaderContent>
                    <DataTableColumnHeaderSortAscending />
                    <DataTableColumnHeaderSortDescending />
                    <DropdownMenuSeparator />
                    <DataTableColumnHeaderHide />
                  </DataTableColumnHeaderContent>
                </DataTableColumnHeader>
              )}
            </TableHead>
          </TableRow>
        </TableHeader>
      </Table>
      {hint && <Text className="text-muted-foreground text-sm">{hint}</Text>}
    </View>
  );
}

export { DataTableColumnHeaderDemo };
