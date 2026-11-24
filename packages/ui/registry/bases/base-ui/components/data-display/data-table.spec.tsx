import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  columnVisibilityFeature,
  createColumnHelper,
  createPaginatedRowModel,
  type ReactTable,
  rowPaginationFeature,
  tableFeatures,
  useTable,
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

const FEATURES = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const COLUMN = createColumnHelper<typeof FEATURES, Row>();

const COLUMNS = COLUMN.columns([
  COLUMN.accessor('name', { header: 'Name' }),
  COLUMN.accessor('size', { header: 'Size' }),
]);

// Module-level, so the data keeps its identity across renders.
const ONE_ROW: Row[] = [{ name: 'a', size: 1 }];
const NO_ROWS: Row[] = [];

const { gearStart, gearStop } = vi.hoisted(() => ({ gearStart: vi.fn(), gearStop: vi.fn() }));

vi.mock('@/registry/bases/base-ui/icons/lucide/settings-2-icon', async () => {
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

function useRowsTable(rows: Row[]): ReactTable<typeof FEATURES, Row> {
  return useTable({ features: FEATURES, data: rows, columns: COLUMNS });
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
    render(<RowsTable rows={NO_ROWS} />);

    expect(screen.getByRole('cell', { name: 'No results.' }).getAttribute('colspan')).toBe('2');
  });

  it('is not rendered while there are rows', async () => {
    render(<RowsTable rows={ONE_ROW} />);

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
  const table = useTable({
    features: FEATURES,
    data: PAGED_ROWS,
    columns: COLUMNS,
    initialState: { pagination: { pageIndex: 0, pageSize: 1 } },
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
    const table = useRowsTable(NO_ROWS);
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
