import {
  columnVisibilityFeature,
  createColumnHelper,
  createSortedRowModel,
  type ReactTable,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import type { MouseEvent, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { drawingIn, expectPlaying, expectStill, playMotion, settled } from '../../../../../test/motion';
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

const FEATURES = tableFeatures({
  columnVisibilityFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
});

const COLUMN = createColumnHelper<typeof FEATURES, Row>();

const COLUMNS = COLUMN.columns([
  COLUMN.accessor('name', { header: 'Name' }),
  COLUMN.accessor('size', { header: 'Size' }),
]);

// Module-level, so the data keeps its identity across renders.
const ROWS: Row[] = [{ name: 'a', size: 1 }];
const NO_ROWS: Row[] = [];

function useRowsTable(rows: Row[]): ReactTable<typeof FEATURES, Row> {
  return useTable({ features: FEATURES, data: rows, columns: COLUMNS });
}

/** Renders the three column actions for `name` in a menu, and the table state they change. */
function ColumnActions({ onClick }: { onClick: (event: MouseEvent) => void }): ReactNode {
  const table = useRowsTable(ROWS);
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
      <output aria-label="Sorting">{JSON.stringify(table.state.sorting)}</output>
      <output aria-label="Visible">{String(column.getIsVisible())}</output>
    </>
  );
}

const sorting = () => page.getByRole('status', { name: 'Sorting' });
const visible = () => page.getByRole('status', { name: 'Visible' });

/** Renders `ColumnActions` and opens its menu from the header's trigger. */
async function openColumnActions(onClick: (event: MouseEvent) => void): Promise<void> {
  await render(<ColumnActions onClick={onClick} />);
  await userEvent.click(page.getByRole('button', { name: 'Name' }));
  await expect.element(page.getByRole('menu')).toBeVisible();
}

describe('DataTableColumnHeader actions', () => {
  it('sorts ascending and still calls the caller onClick', async () => {
    const onClick = vi.fn();
    await openColumnActions(onClick);

    await userEvent.click(page.getByRole('menuitem', { name: 'Asc' }));

    await expect.element(sorting()).toHaveTextContent('[{"id":"name","desc":false}]');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('sorts descending and still calls the caller onClick', async () => {
    const onClick = vi.fn();
    await openColumnActions(onClick);

    await userEvent.click(page.getByRole('menuitem', { name: 'Desc' }));

    await expect.element(sorting()).toHaveTextContent('[{"id":"name","desc":true}]');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('hides the column and still calls the caller onClick', async () => {
    const onClick = vi.fn();
    await openColumnActions(onClick);

    await userEvent.click(page.getByRole('menuitem', { name: 'Hide' }));

    await expect.element(visible()).toHaveTextContent('false');
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('DataTableColumnHeader actions honor a caller preventDefault', () => {
  it('skips the ascending sort when the caller onClick prevents the default', async () => {
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
    await openColumnActions(onClick);

    await userEvent.click(page.getByRole('menuitem', { name: 'Asc' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    await expect.element(sorting()).toHaveTextContent('[]');
  });

  it('skips the descending sort when the caller onClick prevents the default', async () => {
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
    await openColumnActions(onClick);

    await userEvent.click(page.getByRole('menuitem', { name: 'Desc' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    await expect.element(sorting()).toHaveTextContent('[]');
  });

  it('skips hiding the column when the caller onClick prevents the default', async () => {
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
    await openColumnActions(onClick);

    await userEvent.click(page.getByRole('menuitem', { name: 'Hide' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    await expect.element(visible()).toHaveTextContent('true');
  });
});

describe('DataTableColumnHeader', () => {
  it('opens the column menu from the trigger named by its title', async () => {
    await openColumnActions(() => {});

    await expect.element(page.getByRole('menuitem', { name: 'Asc' })).toBeVisible();
    await expect.element(page.getByRole('menuitem', { name: 'Desc' })).toBeVisible();
    await expect.element(page.getByRole('menuitem', { name: 'Hide' })).toBeVisible();
  });

  it('takes a plain title with no menu for a column that neither sorts nor hides', async () => {
    function PlainHeader(): ReactNode {
      const table = useRowsTable(NO_ROWS);
      const column = table.getColumn('name');
      return column ? <DataTableColumnHeader column={column}>Name</DataTableColumnHeader> : null;
    }
    await render(<PlainHeader />);

    await expect.element(page.getByText('Name')).toBeVisible();
    await expect.element(page.getByRole('button')).not.toBeInTheDocument();
  });

  // The browser project runs as a reader who asked for reduced motion.
  it('keeps the sort icon still on hover and focus when the reader prefers reduced motion', async () => {
    await userEvent.unhover(document.body);
    await render(<ColumnActions onClick={() => {}} />);
    const trigger = page.getByRole('button', { name: 'Name' });

    await userEvent.hover(trigger);
    await expectStill(trigger.element());
    await userEvent.unhover(trigger);
    await userEvent.tab();
    await expect.element(trigger).toHaveFocus();
    await expectStill(trigger.element());
  });
});

describe('DataTableColumnHeaderTrigger with motion allowed', () => {
  playMotion();

  it('plays the sort icon while the pointer or the focus is on the trigger', async () => {
    // The pointer rests where the case before left it, which a trigger drawn under it would take as an enter.
    await userEvent.unhover(document.body);
    await render(<ColumnActions onClick={() => {}} />);
    const trigger = page.getByRole('button', { name: 'Name' });

    await userEvent.hover(trigger);
    await expectPlaying(trigger.element(), drawingIn(trigger.element()));
    await userEvent.unhover(trigger);
    const rest = await settled(trigger.element());

    await userEvent.tab();
    await expect.element(trigger).toHaveFocus();
    await expectPlaying(trigger.element(), rest);
  });
});
