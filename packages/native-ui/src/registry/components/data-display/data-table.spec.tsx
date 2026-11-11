import { PortalHost } from '@rn-primitives/portal';
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { act, configure, render, screen, userEvent } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import {
  DataTableColumnHeader,
  DataTableColumnHeaderContent,
  DataTableColumnHeaderSortAscending,
  DataTableColumnHeaderSortDescending,
  DataTableColumnHeaderTrigger,
} from './data-table-column-header';
import {
  DataTable,
  DataTableEmpty,
  DataTablePagination,
  DataTablePaginationNext,
  DataTablePaginationPrevious,
  DataTableToolbar,
  DataTableView,
  DataTableViewOptions,
  useDataTable,
} from './data-table';

// Jest runs no Reanimated frame into the props a query reads, so the opacity a menu fades in from hides it
// from them.
configure({ defaultIncludeHiddenElements: true });

interface FileRow {
  name: string;
  size: string;
}

// Module-level, so the data keeps its identity across renders; a fresh array each render makes the table
// queue a page reset on every render.
const FILES: FileRow[] = [
  { name: 'invoice.csv', size: '12 KB' },
  { name: 'report.pdf', size: '2.4 MB' },
  { name: 'logo.png', size: '340 KB' },
];
const NO_FILES: FileRow[] = [];

const COLUMNS: ColumnDef<FileRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column}>
        <DataTableColumnHeaderTrigger>Name</DataTableColumnHeaderTrigger>
        <DataTableColumnHeaderContent>
          <DataTableColumnHeaderSortAscending />
          <DataTableColumnHeaderSortDescending />
        </DataTableColumnHeaderContent>
      </DataTableColumnHeader>
    ),
  },
  { accessorKey: 'size', header: 'Size' },
];

const FIXED_COLUMNS: ColumnDef<FileRow>[] = COLUMNS.map((column) => ({ ...column, enableHiding: false }));

interface FilesProps {
  data?: FileRow[];
  columns?: ColumnDef<FileRow>[];
  pageSize?: number;
}

/** A file table over a real table instance, with every part of the item. */
function Files({ data = FILES, columns = COLUMNS, pageSize = 10 }: FilesProps): ReactNode {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });
  return (
    <>
      <DataTable table={table}>
        <DataTableToolbar>
          <DataTableViewOptions />
        </DataTableToolbar>
        <DataTableView>
          <DataTableEmpty>No results.</DataTableEmpty>
        </DataTableView>
        <DataTablePagination>
          <DataTablePaginationPrevious aria-label="Previous page" />
          <DataTablePaginationNext aria-label="Next page" />
        </DataTablePagination>
      </DataTable>
      <PortalHost />
    </>
  );
}

// The cells are not accessibility elements of their own, so a reader meets their texts in order.
/** The names in the body, top to bottom. */
function names(): string[] {
  return screen.queryAllByText(/\.(csv|pdf|png)$/).map((text) => String(text.props.children));
}

/** The sizes in the body, top to bottom. */
function sizes(): string[] {
  return screen.queryAllByText(/ [KM]B$/).map((text) => String(text.props.children));
}

describe('DataTable', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // A menu opens where its trigger is laid out, which Jest lays nothing out to report.
    jest
      .spyOn(View.prototype as unknown as { measure: (callback: (...args: number[]) => void) => void }, 'measure')
      .mockImplementation((callback) => callback(0, 0, 100, 40, 50, 200));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  /** Lets a menu's motion finish on Jest's clock. */
  const finishMotion = () => act(() => jest.advanceTimersByTimeAsync(300));

  function setup() {
    return userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  }

  it("renders each column's header and each row's cells, in the table's order", async () => {
    await render(<Files />);

    expect(screen.getByRole('button', { name: 'Name' })).toBeOnTheScreen();
    expect(screen.getByText('Size')).toBeOnTheScreen();
    expect(names()).toEqual(['invoice.csv', 'report.pdf', 'logo.png']);
    expect(sizes()).toEqual(['12 KB', '2.4 MB', '340 KB']);
  });

  it("redraws the rows in the order a column header's sort sets", async () => {
    const user = setup();
    await render(<Files />);

    await user.press(screen.getByRole('button', { name: 'Name' }));
    await finishMotion();
    await user.press(screen.getByRole('menuitem', { name: 'Desc' }));
    await finishMotion();

    expect(names()).toEqual(['report.pdf', 'logo.png', 'invoice.csv']);
    expect(sizes()).toEqual(['2.4 MB', '340 KB', '12 KB']);
  });

  it('steps through the pages, each step disabled at its end', async () => {
    const user = setup();
    await render(<Files pageSize={2} />);
    const previous = screen.getByRole('button', { name: 'Previous page' });
    const next = screen.getByRole('button', { name: 'Next page' });

    expect(previous).toBeDisabled();
    expect(names()).toEqual(['invoice.csv', 'report.pdf']);

    await user.press(next);

    expect(names()).toEqual(['logo.png']);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();

    await user.press(screen.getByRole('button', { name: 'Previous page' }));

    expect(names()).toEqual(['invoice.csv', 'report.pdf']);
  });

  it('hides a column unchecked in the view options, and shows it again', async () => {
    const user = setup();
    await render(<Files />);

    await user.press(screen.getByRole('button', { name: 'Toggle columns' }));
    await finishMotion();

    expect(screen.getByRole('checkbox', { name: 'name' })).toBeChecked();
    await user.press(screen.getByRole('checkbox', { name: 'size' }));
    await finishMotion();

    expect(screen.getByRole('checkbox', { name: 'size' })).not.toBeChecked();
    expect(screen.queryByText('Size')).toBeNull();
    expect(sizes()).toEqual([]);
    expect(names()).toEqual(['invoice.csv', 'report.pdf', 'logo.png']);

    await user.press(screen.getByRole('checkbox', { name: 'size' }));
    await finishMotion();

    expect(screen.getByText('Size')).toBeOnTheScreen();
    expect(sizes()).toEqual(['12 KB', '2.4 MB', '340 KB']);
  });

  it('draws no view options when no column can hide', async () => {
    await render(<Files columns={FIXED_COLUMNS} />);

    expect(screen.queryByRole('button', { name: 'Toggle columns' })).toBeNull();
  });

  it('shows its empty state while there are no rows, and only then', async () => {
    await render(<Files data={NO_FILES} />);

    expect(screen.getByText('No results.')).toBeOnTheScreen();
    expect(names()).toEqual([]);

    await render(<Files />);

    expect(screen.queryByText('No results.')).toBeNull();
  });

  it('throws when a part is rendered outside DataTable', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    function Outside(): ReactNode {
      useDataTable();
      return null;
    }

    await expect(render(<Outside />)).rejects.toThrow('DataTable parts must be used within <DataTable>');
  });
});
