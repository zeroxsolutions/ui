import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  type Table as TanstackTable,
  useReactTable,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { drawingIn, expectPlaying, playMotion, settled } from '../../../../../test/motion';
import {
  DataTable,
  DataTableEmpty,
  DataTablePagination,
  DataTablePaginationNext,
  DataTablePaginationPrevious,
  DataTableView,
  DataTableViewOptions,
} from './data-table';

interface Row {
  name: string;
  size: number;
}

const COLUMNS: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'size', header: 'Size' },
];

function useRowsTable(rows: Row[]): TanstackTable<Row> {
  return useReactTable({
    data: rows,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
  });
}

function RowsTable({ rows }: { rows: Row[] }): ReactNode {
  const table = useRowsTable(rows);
  return (
    <DataTable table={table}>
      <DataTableView>
        <DataTableEmpty>No results.</DataTableEmpty>
      </DataTableView>
    </DataTable>
  );
}

describe('DataTableEmpty', () => {
  it('renders one cell spanning every column when there are no rows', async () => {
    await render(<RowsTable rows={[]} />);

    await expect.element(page.getByRole('cell', { name: 'No results.' })).toHaveAttribute('colspan', '2');
  });

  it('is not rendered while there are rows', async () => {
    await render(<RowsTable rows={[{ name: 'a', size: 1 }]} />);

    await expect.element(page.getByRole('cell', { name: 'a', exact: true })).toBeVisible();
    await expect.element(page.getByText('No results.')).not.toBeInTheDocument();
  });
});

// Module-level, so the data keeps its identity across renders; a fresh array each render makes the
// table queue a page reset on every render.
const PAGED_ROWS: Row[] = [
  { name: 'a', size: 1 },
  { name: 'b', size: 2 },
];

function PagedTable(): ReactNode {
  const table = useReactTable({
    data: PAGED_ROWS,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 1 } },
  });
  return (
    <DataTable table={table}>
      <DataTableView />
      <DataTablePagination>
        <DataTablePaginationPrevious aria-label="Previous page" />
        <DataTablePaginationNext aria-label="Next page" />
      </DataTablePagination>
    </DataTable>
  );
}

describe('DataTablePagination', () => {
  it('steps to the next page and back', async () => {
    await render(<PagedTable />);
    const previous = page.getByRole('button', { name: 'Previous page' });
    await expect.element(previous).toBeDisabled();

    await userEvent.click(page.getByRole('button', { name: 'Next page' }));
    await expect.element(page.getByRole('cell', { name: 'b', exact: true })).toBeVisible();

    await userEvent.click(previous);
    await expect.element(page.getByRole('cell', { name: 'a', exact: true })).toBeVisible();
  });
});

describe('DataTableViewOptions', () => {
  playMotion();

  function OptionsTable({ onPointerEnter }: { onPointerEnter?: () => void }): ReactNode {
    const table = useRowsTable([]);
    return (
      <DataTable table={table}>
        <DataTableViewOptions onPointerEnter={onPointerEnter} />
      </DataTable>
    );
  }

  it("plays the gear while the pointer or the focus is on the trigger, still running the caller's handler", async () => {
    // The pointer rests where the case before left it, which a trigger drawn under it would take as an enter.
    await userEvent.unhover(document.body);
    const onPointerEnter = vi.fn();
    await render(<OptionsTable onPointerEnter={onPointerEnter} />);
    const trigger = page.getByRole('button', { name: 'Toggle columns' });

    await userEvent.hover(trigger);
    await expectPlaying(trigger.element(), drawingIn(trigger.element()));
    expect(onPointerEnter).toHaveBeenCalledTimes(1);
    await userEvent.unhover(trigger);
    const rest = await settled(trigger.element());

    await userEvent.tab();
    await expect.element(trigger).toHaveFocus();
    await expectPlaying(trigger.element(), rest);
  });
});
