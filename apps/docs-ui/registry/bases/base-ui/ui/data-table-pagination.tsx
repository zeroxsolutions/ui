import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/registry/bases/base-ui/ui/button"
import { useDataTable } from "@/registry/bases/base-ui/ui/data-table"
import { cn } from "@/registry/bases/base-ui/lib/utils"

interface DataTablePaginationProps {
  /** Status line (e.g. a localized "Page 1 of 3"); omit to hide it. */
  children?: React.ReactNode
  className?: string
  /** Accessible names for the icon-only buttons (override per locale). */
  previousLabel?: string
  nextLabel?: string
}

/**
 * Prev/next pager reading the table from <DataTable> context. Pass children for
 * a status line — the consumer's i18n owns "Page X of Y" — and the icon-only
 * buttons take overridable accessible names.
 */
function DataTablePagination({
  children,
  className,
  previousLabel = "Previous page",
  nextLabel = "Next page",
}: DataTablePaginationProps) {
  const table = useDataTable()
  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      {children}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
        aria-label={previousLabel}
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
        aria-label={nextLabel}
      >
        <ChevronRight />
      </Button>
    </div>
  )
}

export { DataTablePagination }
