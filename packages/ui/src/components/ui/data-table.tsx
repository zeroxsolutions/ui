/**
 * Shared DataTable — the shadcn/ui reusable-components recipe over
 * `@tanstack/react-table` (https://ui.shadcn.com/docs/components/base/data-table#reusable-components),
 * on top of the `Table` primitive (framed in `rounded-md border` like the rest
 * of the app's tables). Column-def driven, with:
 *  - `DataTableColumnHeader` — sortable/hideable header (DropdownMenu: Asc / Desc
 *    / Hide).
 *  - `DataTableViewOptions` — column-visibility toggle.
 *  - `DataTablePagination` — Prev/Next + page counter.
 *  - a generic `DataTable` wrapper owning sorting/visibility, an optional filter
 *    input (`filterColumn`) and client pagination (`pageSize`), plus our
 *    additions: a loading skeleton and an empty state.
 *
 * Opt-in per surface: pass `filterColumn` for a search box, `pageSize` for
 * pagination, `enableHiding` for the Hide menu + "Columns" toolbar. Per-column
 * alignment/label ride `columnDef.meta`.
 *
 * Base UI note: the DropdownMenu triggers use Base UI's `render` prop (not Radix
 * `asChild`) and the trigger open-state hook is `data-[popup-open]`.
 */
import * as React from "react"
import {
  type Column,
  type ColumnDef,
  type RowData,
  type SortingState,
  type Table as ReactTable,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  EyeOff,
  Settings2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

// Per-column extras read off `columnDef.meta`.
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Applied to the column's header cell and every body cell (e.g. `text-right`). */
    className?: string
    /** Human label for the column-visibility menu (defaults to the column id). */
    label?: string
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /** Render skeleton rows instead of data. */
  loading?: boolean
  /** Skeleton row count while loading. */
  skeletonRows?: number
  emptyMessage?: React.ReactNode
  /** Allow hiding columns (adds the Hide menu item + the "Columns" toolbar). */
  enableHiding?: boolean
  /** Column id to filter by — renders a search box above the table. */
  filterColumn?: string
  filterPlaceholder?: string
  /** Page size — enables client pagination + the pager footer. */
  pageSize?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  skeletonRows = 6,
  emptyMessage = "No results.",
  enableHiding = false,
  filterColumn,
  filterPlaceholder = "Filter…",
  pageSize,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    enableHiding,
    state: { sorting, columnVisibility },
    initialState: pageSize ? { pagination: { pageSize } } : undefined,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(pageSize ? { getPaginationRowModel: getPaginationRowModel() } : {}),
  })

  const filter = filterColumn ? table.getColumn(filterColumn) : undefined
  const showToolbar = Boolean(filter) || enableHiding

  return (
    <div className="space-y-2">
      {showToolbar && (
        <div className="flex items-center gap-2">
          {filter && (
            <Input
              value={(filter.getFilterValue() as string) ?? ""}
              onChange={(e) => filter.setFilterValue(e.target.value)}
              placeholder={filterPlaceholder}
              className="h-8 max-w-xs"
            />
          )}
          {enableHiding && (
            <div className="ml-auto">
              <DataTableViewOptions table={table} />
            </div>
          )}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.columnDef.meta?.className}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, r) => (
                <TableRow key={`skeleton-${r}`}>
                  {columns.map((_, c) => (
                    <TableCell key={c}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.className}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleFlatColumns().length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pageSize && !loading && table.getRowModel().rows.length > 0 && (
        <DataTablePagination table={table} />
      )}
    </div>
  )
}

/** Sortable + hideable column header (DropdownMenu: Asc / Desc / Hide). */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  align = "left",
}: {
  column: Column<TData, TValue>
  title: string
  align?: "left" | "right"
}) {
  if (!column.getCanSort() && !column.getCanHide()) return <span>{title}</span>

  const sorted = column.getIsSorted()
  const SortIcon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 gap-1.5 px-2 text-muted-foreground hover:text-foreground data-[popup-open]:text-foreground",
              align === "right" ? "-mr-2 flex-row-reverse" : "-ml-2"
            )}
          />
        }
      >
        <span>{title}</span>
        <SortIcon className={cn("size-3.5", sorted === false && "opacity-50")} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align === "right" ? "end" : "start"}>
        {column.getCanSort() && (
          <>
            <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
              <ArrowUp className="text-muted-foreground/70" /> Asc
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
              <ArrowDown className="text-muted-foreground/70" /> Desc
            </DropdownMenuItem>
          </>
        )}
        {column.getCanSort() && column.getCanHide() && <DropdownMenuSeparator />}
        {column.getCanHide() && (
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="text-muted-foreground/70" /> Hide
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Column-visibility toggle ("Columns"). */
export function DataTableViewOptions<TData>({
  table,
}: {
  table: ReactTable<TData>
}) {
  const columns = table
    .getAllColumns()
    .filter((c) => typeof c.accessorFn !== "undefined" && c.getCanHide())
  if (columns.length === 0) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className="h-8" />}
      >
        <Settings2 className="size-4" /> Columns
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}
          >
            {column.columnDef.meta?.label ?? column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Prev/Next pager with a page counter. */
export function DataTablePagination<TData>({
  table,
}: {
  table: ReactTable<TData>
}) {
  const { pageIndex } = table.getState().pagination
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-sm text-muted-foreground tabular-nums">
        Page {pageIndex + 1} of {table.getPageCount() || 1}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        Next
      </Button>
    </div>
  )
}
