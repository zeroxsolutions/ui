import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Table as TanstackTable,
  useReactTable,
} from '@tanstack/react-table';
import type { MouseEvent, ReactNode } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { DropdownMenu, DropdownMenuContent } from '@/registry/bases/base-ui/ui/dropdown-menu';
import {
  DataTable,
  DataTableColumnHeaderHide,
  DataTableColumnHeaderSortAscending,
  DataTableColumnHeaderSortDescending,
  DataTableEmpty,
  DataTablePagination,
  DataTableView,
} from './data-table';

interface Row {
  name: string;
  size: number;
}

const COLUMNS: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'size', header: 'Size' },
];

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.getAnimations ??= () => [];
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

function useRowsTable(rows: Row[]): TanstackTable<Row> {
  return useReactTable({
    data: rows,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
}

/** Renders the three column actions for `name` in an open menu, and the table state they change. */
function ColumnActions({ onClick }: { onClick: (event: MouseEvent) => void }): ReactNode {
  const table = useRowsTable([{ name: 'a', size: 1 }]);
  const column = table.getColumn('name');
  if (!column) return null;
  return (
    <>
      <DropdownMenu open>
        <DropdownMenuContent>
          <DataTableColumnHeaderSortAscending column={column} onClick={onClick} />
          <DataTableColumnHeaderSortDescending column={column} onClick={onClick} />
          <DataTableColumnHeaderHide column={column} onClick={onClick} />
        </DropdownMenuContent>
      </DropdownMenu>
      <output data-testid="sorting">{JSON.stringify(table.getState().sorting)}</output>
      <output data-testid="visible">{String(column.getIsVisible())}</output>
    </>
  );
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

describe('DataTableColumnHeader actions', () => {
  it('sorts ascending and still calls the caller onClick', async () => {
    const onClick = vi.fn();
    render(<ColumnActions onClick={onClick} />);

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Asc' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('sorting').textContent).toBe('[{"id":"name","desc":false}]');
  });

  it('sorts descending and still calls the caller onClick', async () => {
    const onClick = vi.fn();
    render(<ColumnActions onClick={onClick} />);

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Desc' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('sorting').textContent).toBe('[{"id":"name","desc":true}]');
  });

  it('hides the column and still calls the caller onClick', async () => {
    const onClick = vi.fn();
    render(<ColumnActions onClick={onClick} />);

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Hide' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('visible').textContent).toBe('false');
  });
});

describe('DataTableColumnHeader actions honor a caller preventDefault', () => {
  it('skips the ascending sort when the caller onClick prevents the default', async () => {
    render(<ColumnActions onClick={(event) => event.preventDefault()} />);

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Asc' }));

    expect(screen.getByTestId('sorting').textContent).toBe('[]');
  });

  it('skips the descending sort when the caller onClick prevents the default', async () => {
    render(<ColumnActions onClick={(event) => event.preventDefault()} />);

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Desc' }));

    expect(screen.getByTestId('sorting').textContent).toBe('[]');
  });

  it('skips hiding the column when the caller onClick prevents the default', async () => {
    render(<ColumnActions onClick={(event) => event.preventDefault()} />);

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Hide' }));

    expect(screen.getByTestId('visible').textContent).toBe('true');
  });
});

describe('DataTableEmpty', () => {
  it('renders one cell spanning every column when there are no rows', () => {
    render(<RowsTable rows={[]} />);

    const cell = screen.getByText('No results.').closest('td');
    expect(cell?.getAttribute('data-slot')).toBe('data-table-empty');
    expect(cell?.getAttribute('colspan')).toBe('2');
  });

  it('is not rendered while there are rows', () => {
    render(<RowsTable rows={[{ name: 'a', size: 1 }]} />);

    expect(screen.queryByText('No results.')).toBeNull();
    expect(screen.getByRole('cell', { name: 'a' })).toBeTruthy();
  });
});

function PagedTable(): ReactNode {
  const table = useReactTable({
    data: [
      { name: 'a', size: 1 },
      { name: 'b', size: 2 },
    ],
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 1 } },
  });
  return (
    <DataTable table={table}>
      <DataTableView />
      <DataTablePagination />
    </DataTable>
  );
}

describe('DataTableView', () => {
  it('scrolls the table inside a ScrollArea rather than the page', () => {
    render(<RowsTable rows={[{ name: 'a', size: 1 }]} />);

    expect(screen.getByRole('table').closest('[data-slot="scroll-area"]')).not.toBeNull();
  });
});

describe('DataTablePagination', () => {
  it('steps to the next page and back', () => {
    render(<PagedTable />);
    const previous = screen.getByRole('button', { name: 'Previous page' });
    expect(previous.hasAttribute('disabled')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByRole('cell', { name: 'b' })).toBeTruthy();

    fireEvent.click(previous);
    expect(screen.getByRole('cell', { name: 'a' })).toBeTruthy();
  });
});
