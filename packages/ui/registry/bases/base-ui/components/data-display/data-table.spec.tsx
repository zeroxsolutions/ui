import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  type Table as TanstackTable,
  useReactTable,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

const { gearStart, gearStop } = vi.hoisted(() => ({ gearStart: vi.fn(), gearStop: vi.fn() }));

vi.mock('@/registry/bases/base-ui/icons/settings-2-icon', async () => {
  const React = await import('react');
  return {
    Settings2Icon: React.forwardRef<unknown, { 'aria-hidden'?: boolean }>((props, ref) => {
      React.useImperativeHandle(ref, () => ({ startAnimation: gearStart, stopAnimation: gearStop }));
      return <svg data-testid="settings-2-icon" aria-hidden={props['aria-hidden']} />;
    }),
  };
});

afterEach(() => {
  cleanup();
  gearStart.mockClear();
  gearStop.mockClear();
});

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
    render(<RowsTable rows={[]} />);

    expect(screen.getByRole('cell', { name: 'No results.' }).getAttribute('colspan')).toBe('2');
  });

  it('is not rendered while there are rows', async () => {
    render(<RowsTable rows={[{ name: 'a', size: 1 }]} />);

    expect(screen.queryByText('No results.')).toBeNull();
    expect(screen.getByRole('cell', { name: 'a' })).toBeTruthy();
  });
});

// Module-level, so the data keeps its identity across renders; a fresh array each render makes the
// table queue a page reset on every render, and the act() around a click never settles.
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
    render(<PagedTable />);
    const previous = screen.getByRole('button', { name: 'Previous page' });
    expect(previous.hasAttribute('disabled')).toBe(true);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    });
    expect(screen.getByRole('cell', { name: 'b' })).toBeTruthy();

    await act(async () => {
      fireEvent.click(previous);
    });
    expect(screen.getByRole('cell', { name: 'a' })).toBeTruthy();
  });
});

describe('DataTableViewOptions icon', () => {
  function OptionsTable({ onPointerEnter }: { onPointerEnter?: () => void }): ReactNode {
    const table = useRowsTable([]);
    return (
      <DataTable table={table}>
        <DataTableViewOptions onPointerEnter={onPointerEnter} />
      </DataTable>
    );
  }

  it('plays the gear once while the pointer and the focus hold the trigger, and stops when both leave', () => {
    const onPointerEnter = vi.fn();
    render(<OptionsTable onPointerEnter={onPointerEnter} />);
    const trigger = screen.getByRole('button', { name: 'Toggle columns' });

    fireEvent.pointerEnter(trigger);
    fireEvent.focus(trigger);
    expect(gearStart).toHaveBeenCalledTimes(1);
    expect(onPointerEnter).toHaveBeenCalledTimes(1);

    fireEvent.pointerLeave(trigger);
    expect(gearStop).not.toHaveBeenCalled();
    fireEvent.blur(trigger);
    expect(gearStop).toHaveBeenCalledTimes(1);
    expect(gearStart).toHaveBeenCalledTimes(1);
  });
});
