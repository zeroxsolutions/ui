import { PortalHost } from '@rn-primitives/portal';
import { getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { act, configure, render, screen, userEvent } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { DropdownMenuSeparator } from '../../ui/dropdown-menu';
import { Text } from '../../ui/text';
import {
  DataTableColumnHeader,
  DataTableColumnHeaderContent,
  DataTableColumnHeaderHide,
  DataTableColumnHeaderSortAscending,
  DataTableColumnHeaderSortDescending,
  DataTableColumnHeaderTrigger,
} from './data-table-column-header';

// Jest runs no Reanimated frame into the props a query reads, so the opacity the menu fades in from hides it
// from them.
configure({ defaultIncludeHiddenElements: true });

interface FileRow {
  name: string;
  size: string;
}

const COLUMNS: ColumnDef<FileRow>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'size', header: 'Size' },
];

interface HeaderProps {
  onAscending?: () => void;
  onDescending?: () => void;
  onHide?: () => void;
  /** Draws the title alone, for a column that neither sorts nor hides. */
  plain?: boolean;
}

/** The "Name" column's header over a real table, beside what the table says of that column. */
function Header({ onAscending, onDescending, onHide, plain = false }: HeaderProps): ReactNode {
  const table = useReactTable({
    data: [],
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  const column = table.getColumn('name');
  if (!column) return null;
  return (
    <>
      {plain ? (
        <DataTableColumnHeader column={column}>Name</DataTableColumnHeader>
      ) : (
        <DataTableColumnHeader column={column}>
          <DataTableColumnHeaderTrigger>Name</DataTableColumnHeaderTrigger>
          <DataTableColumnHeaderContent>
            <DataTableColumnHeaderSortAscending onPress={onAscending} />
            <DataTableColumnHeaderSortDescending onPress={onDescending} />
            <DropdownMenuSeparator />
            <DataTableColumnHeaderHide onPress={onHide} />
          </DataTableColumnHeaderContent>
        </DataTableColumnHeader>
      )}
      <Text>{`sorted: ${String(column.getIsSorted())}`}</Text>
      <Text>{`visible: ${String(column.getIsVisible())}`}</Text>
      <PortalHost />
    </>
  );
}

describe('DataTableColumnHeader', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // The menu opens where the trigger is laid out, which Jest lays nothing out to report.
    jest
      .spyOn(View.prototype as unknown as { measure: (callback: (...args: number[]) => void) => void }, 'measure')
      .mockImplementation((callback) => callback(0, 0, 100, 40, 50, 200));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  /** Lets the menu's motion finish on Jest's clock. */
  const finishMotion = () => act(() => jest.advanceTimersByTimeAsync(300));

  async function choose(item: string, props: HeaderProps = {}): Promise<void> {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<Header {...props} />);
    await user.press(screen.getByRole('button', { name: 'Name' }));
    await finishMotion();
    await user.press(screen.getByRole('menuitem', { name: item }));
    await finishMotion();
  }

  it('opens the column menu from the trigger named by its title', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<Header />);

    expect(screen.queryByRole('menuitem')).toBeNull();

    await user.press(screen.getByRole('button', { name: 'Name' }));
    await finishMotion();

    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    expect(screen.getByRole('menuitem', { name: 'Asc' })).toBeOnTheScreen();
    expect(screen.getByRole('menuitem', { name: 'Desc' })).toBeOnTheScreen();
    expect(screen.getByRole('menuitem', { name: 'Hide' })).toBeOnTheScreen();
  });

  it('sorts ascending and still calls the caller onPress', async () => {
    const onAscending = jest.fn();
    await choose('Asc', { onAscending });

    expect(screen.getByText('sorted: asc')).toBeOnTheScreen();
    expect(onAscending).toHaveBeenCalledTimes(1);
  });

  it('sorts descending and still calls the caller onPress', async () => {
    const onDescending = jest.fn();
    await choose('Desc', { onDescending });

    expect(screen.getByText('sorted: desc')).toBeOnTheScreen();
    expect(onDescending).toHaveBeenCalledTimes(1);
  });

  it('hides the column and still calls the caller onPress', async () => {
    const onHide = jest.fn();
    await choose('Hide', { onHide });

    expect(screen.getByText('visible: false')).toBeOnTheScreen();
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('takes a plain title with no menu for a column that neither sorts nor hides', async () => {
    await render(<Header plain />);

    expect(screen.getByText('Name')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('throws when a part is rendered outside DataTableColumnHeader', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(render(<DataTableColumnHeaderHide />)).rejects.toThrow(
      'DataTableColumnHeader parts must be used within <DataTableColumnHeader>',
    );
  });
});
