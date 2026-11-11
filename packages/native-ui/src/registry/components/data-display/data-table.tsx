import { flexRender, type ColumnDefTemplate, type Table as TanstackTable } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Settings2, type LucideIcon } from 'lucide-react-native';
import { createContext, useContext, useMemo, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import { asText } from '../../lib/text-children';
import { cn } from '../../lib/utils';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { Empty } from '../../ui/empty';
import { Icon } from '../../ui/icon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Text } from '../../ui/text';

interface DataTableContextValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- one context holds a table of any row type; useDataTable narrows it
  table: TanstackTable<any>;
}

const DataTableContext = createContext<DataTableContextValue | null>(null);

/**
 * Reads the `@tanstack/react-table` instance the surrounding DataTable holds.
 * @throws {Error} when called outside a DataTable
 */
function useDataTable<TData>(): TanstackTable<TData> {
  const context = useContext(DataTableContext);
  if (!context) throw new Error('DataTable parts must be used within <DataTable>');
  return context.table as TanstackTable<TData>;
}

type DataTableProps<TData> = ComponentProps<typeof View> & {
  /** The instance the caller's `useReactTable` returns, which every part reads. */
  table: TanstackTable<TData>;
};

/**
 * The root of a data table, holding the caller's table instance for its toolbar, view, view options and pager,
 * which it stacks with a gap. The caller owns `useReactTable` and its column definitions, and with them the
 * sorting, paging and visibility state; the parts only render it.
 */
function DataTable<TData>({ table, className, ...props }: DataTableProps<TData>): ReactNode {
  const value = useMemo(() => ({ table }), [table]);
  return (
    <DataTableContext.Provider value={value}>
      <View className={cn('gap-2', className)} {...props} />
    </DataTableContext.Provider>
  );
}

/** A row for filters and actions above the table. */
function DataTableToolbar({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('flex-row items-center gap-2', className)} {...props} />;
}

interface TemplateContentProps<TProps extends object> {
  /** A column definition's `header` or `cell`. */
  template: ColumnDefTemplate<TProps> | undefined;
  /** What the template is rendered with: the header's or the cell's context. */
  context: TProps;
}

/**
 * A header's or a cell's content, drawn in a Text where it is only text. A View cannot hold a bare string, and the
 * default cell, like a header written as a function, returns one; `flexRender` would make that function an element
 * whose string lands in the cell's View, so a plain function is called here instead, still once per cell, so a
 * template's hooks keep their order.
 */
function TemplateContent<TProps extends object>({ template, context }: TemplateContentProps<TProps>): ReactNode {
  const isPlainFunction =
    typeof template === 'function' &&
    !(template.prototype as { isReactComponent?: unknown } | undefined)?.isReactComponent;
  return asText(isPlainFunction ? (template as (props: TProps) => ReactNode)(context) : flexRender(template, context));
}

/**
 * The table's header and the current page of rows, drawn from the DataTable's instance in a bordered frame, each
 * row's cells sharing its width equally. `children` are drawn in the body only while there are no
 * rows, such as a DataTableEmpty.
 * @throws {Error} when rendered outside a DataTable
 */
function DataTableView({ children, className, ...props }: ComponentProps<typeof View>): ReactNode {
  const table = useDataTable();
  const rows = table.getRowModel().rows;
  // border-border, since React Native draws a border black unless told, where the web's base layer colours every
  // border.
  return (
    <View className={cn('cn-data-table-container border-border overflow-hidden border', className)} {...props}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <TemplateContent template={header.column.columnDef.header} context={header.getContext()} />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length > 0
            ? rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <TemplateContent template={cell.column.columnDef.cell} context={cell.getContext()} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : children}
        </TableBody>
      </Table>
    </View>
  );
}

/**
 * What a DataTableView shows while there are no rows: one block across the body, its `children` centred in an
 * Empty. Every other prop goes to the block.
 */
function DataTableEmpty({ children, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    <View {...props}>
      <Empty>{asText(children)}</Empty>
    </View>
  );
}

/**
 * The pager's row, aligned to the end. `children` are its content: a status line such as "Page 1 of 3", whose copy
 * is the caller's, and the DataTablePaginationPrevious and DataTablePaginationNext buttons.
 */
function DataTablePagination({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('flex-row items-center justify-end gap-2', className)} {...props} />;
}

type DataTablePaginationStepProps = Omit<ComponentProps<typeof Button>, 'children'> & {
  /** The icon-only button's name for a screen reader, such as "Previous page". */
  'aria-label': string;
};

/** An outline icon button that steps the pager, drawing `icon`. */
function DataTablePaginationStep({ icon, ...props }: DataTablePaginationStepProps & { icon: LucideIcon }): ReactNode {
  return (
    <Button variant="outline" size="icon-sm" {...props}>
      <Icon as={icon} />
    </Button>
  );
}

/**
 * Steps the table back one page, disabled on the first; `aria-label` names it.
 * @throws {Error} when rendered outside a DataTable
 */
function DataTablePaginationPrevious(props: DataTablePaginationStepProps): ReactNode {
  const table = useDataTable();
  return (
    <DataTablePaginationStep
      icon={ChevronLeft}
      onPress={() => table.previousPage()}
      disabled={!table.getCanPreviousPage()}
      {...props}
    />
  );
}

/**
 * Steps the table on one page, disabled on the last; `aria-label` names it.
 * @throws {Error} when rendered outside a DataTable
 */
function DataTablePaginationNext(props: DataTablePaginationStepProps): ReactNode {
  const table = useDataTable();
  return (
    <DataTablePaginationStep
      icon={ChevronRight}
      onPress={() => table.nextPage()}
      disabled={!table.getCanNextPage()}
      {...props}
    />
  );
}

type DataTableViewOptionsProps = Omit<ComponentProps<typeof Button>, 'children'> & {
  /** A visible label after the trigger's icon. */
  children?: ReactNode;
};

/**
 * A menu that shows and hides the table's columns, a checkbox per column that has an accessor and can hide, named
 * by the column's id. Its trigger is an outline button with a settings icon, named "Toggle columns" unless an
 * `aria-label` is given; `children` add a visible label after the icon. It draws nothing when no column can hide.
 * @throws {Error} when rendered outside a DataTable
 */
function DataTableViewOptions({ children, ...props }: DataTableViewOptionsProps): ReactNode {
  const table = useDataTable();
  const columns = table
    .getAllColumns()
    .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide());

  if (columns.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Toggle columns" {...props}>
          <Icon as={Settings2} />
          {asText(children)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* The menu is drawn in the app's PortalHost, which the DataTable's context does not reach, so the items
            take their columns from this render rather than from useDataTable. */}
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(value)}
          >
            <Text className="capitalize">{column.id}</Text>
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
export type { DataTableProps, DataTablePaginationStepProps, DataTableViewOptionsProps };
