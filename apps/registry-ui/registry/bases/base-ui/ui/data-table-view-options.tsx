import * as React from 'react';
import { Settings2 } from 'lucide-react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { useDataTable } from '@/registry/bases/base-ui/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';

interface DataTableViewOptionsProps {
  /** Trigger label next to the icon; omit for an icon-only trigger. */
  children?: React.ReactNode;
  className?: string;
  /** Accessible name for the trigger (override per locale). */
  'aria-label'?: string;
}

/**
 * Column-visibility toggle, reading the table from <DataTable> context. The
 * trigger is icon-only by default — pass children to add a visible label (the
 * consumer's i18n owns that copy). No "Toggle columns" heading: the checkbox
 * list speaks for itself, matching shadcn.
 */
function DataTableViewOptions({
  children,
  className,
  'aria-label': ariaLabel = 'Toggle columns',
}: DataTableViewOptionsProps) {
  const table = useDataTable();
  const columns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== 'undefined' && column.getCanHide(),
    );

  if (columns.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={className}
            aria-label={ariaLabel}
          />
        }
      >
        <Settings2 />
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="capitalize"
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}
          >
            {column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DataTableViewOptions };
