import * as React from "react"
import { type Column } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.ComponentProps<"div"> {
  column: Column<TData, TValue>
  /** Sort / hide action labels (override per locale; default English). */
  labels?: { ascending?: string; descending?: string; hide?: string }
}

/**
 * Sortable / hideable header. Used inside a column's `header`, so it takes the
 * `column` directly (column defs live outside the render tree, can't read
 * context). Its title is `children` (consumer copy); the sort/hide action labels
 * default to English and are overridable via `labels`.
 */
function DataTableColumnHeader<TData, TValue>({
  column,
  children,
  labels,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return (
      <div className={cn(className)} {...props}>
        {children}
      </div>
    )
  }

  const sorted = column.getIsSorted()
  const { ascending = "Asc", descending = "Desc", hide = "Hide" } = labels ?? {}

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2.5 data-[popup-open]:bg-accent"
            />
          }
        >
          {children}
          {sorted === "desc" ? (
            <ArrowDown className="size-3.5" />
          ) : sorted === "asc" ? (
            <ArrowUp className="size-3.5" />
          ) : (
            <ChevronsUpDown className="size-3.5 opacity-50" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {column.getCanSort() && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUp className="text-muted-foreground/70" />
                {ascending}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDown className="text-muted-foreground/70" />
                {descending}
              </DropdownMenuItem>
            </>
          )}
          {column.getCanSort() && column.getCanHide() && (
            <DropdownMenuSeparator />
          )}
          {column.getCanHide() && (
            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
              <EyeOff className="text-muted-foreground/70" />
              {hide}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export { DataTableColumnHeader }
