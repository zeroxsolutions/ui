import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  type ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  type Table as TanstackTable,
  useReactTable,
} from '@tanstack/react-table';
import type { MouseEvent, ReactNode } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  DataTableColumnHeader,
  DataTableColumnHeaderContent,
  DataTableColumnHeaderHide,
  DataTableColumnHeaderSortAscending,
  DataTableColumnHeaderSortDescending,
  DataTableColumnHeaderTrigger,
} from './data-table-column-header';

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
      <DataTableColumnHeader column={column}>
        <DataTableColumnHeaderTrigger>Name</DataTableColumnHeaderTrigger>
        <DataTableColumnHeaderContent>
          <DataTableColumnHeaderSortAscending onClick={onClick} />
          <DataTableColumnHeaderSortDescending onClick={onClick} />
          <DataTableColumnHeaderHide onClick={onClick} />
        </DataTableColumnHeaderContent>
      </DataTableColumnHeader>
      <output data-testid="sorting">{JSON.stringify(table.getState().sorting)}</output>
      <output data-testid="visible">{String(column.getIsVisible())}</output>
    </>
  );
}

/** Renders `ColumnActions` and opens its menu from the header's trigger. */
async function openColumnActions(onClick: (event: MouseEvent) => void): Promise<void> {
  render(<ColumnActions onClick={onClick} />);
  fireEvent.click(screen.getByRole('button', { name: 'Name' }));
  await screen.findByRole('menu');
}

describe('DataTableColumnHeader actions', () => {
  it('sorts ascending and still calls the caller onClick', async () => {
    const onClick = vi.fn();
    await openColumnActions(onClick);

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Asc' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('sorting').textContent).toBe('[{"id":"name","desc":false}]');
  });

  it('sorts descending and still calls the caller onClick', async () => {
    const onClick = vi.fn();
    await openColumnActions(onClick);

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Desc' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('sorting').textContent).toBe('[{"id":"name","desc":true}]');
  });

  it('hides the column and still calls the caller onClick', async () => {
    const onClick = vi.fn();
    await openColumnActions(onClick);

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Hide' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('visible').textContent).toBe('false');
  });
});

describe('DataTableColumnHeader actions honor a caller preventDefault', () => {
  it('skips the ascending sort when the caller onClick prevents the default', async () => {
    await openColumnActions((event) => event.preventDefault());

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Asc' }));

    expect(screen.getByTestId('sorting').textContent).toBe('[]');
  });

  it('skips the descending sort when the caller onClick prevents the default', async () => {
    await openColumnActions((event) => event.preventDefault());

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Desc' }));

    expect(screen.getByTestId('sorting').textContent).toBe('[]');
  });

  it('skips hiding the column when the caller onClick prevents the default', async () => {
    await openColumnActions((event) => event.preventDefault());

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Hide' }));

    expect(screen.getByTestId('visible').textContent).toBe('true');
  });
});

describe('DataTableColumnHeader', () => {
  it('opens the column menu from the trigger named by its title', async () => {
    await openColumnActions(() => {});

    expect(screen.getByRole('menuitem', { name: 'Asc' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Desc' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Hide' })).toBeTruthy();
  });

  it('takes a plain title with no menu for a column that neither sorts nor hides', () => {
    function PlainHeader(): ReactNode {
      const table = useRowsTable([]);
      const column = table.getColumn('name');
      return column ? <DataTableColumnHeader column={column}>Name</DataTableColumnHeader> : null;
    }
    render(<PlainHeader />);

    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
