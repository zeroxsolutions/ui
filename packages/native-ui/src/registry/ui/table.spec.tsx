import { render, screen, userEvent } from '@testing-library/react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table';
import { Text } from './text';

function classesOf(testID: string): string[] {
  return emittedClasses(screen.getByTestId(testID).props.className);
}

function renderInvoices(onRow = jest.fn()) {
  return render(
    <Table testID="table">
      <TableCaption>Recent invoices</TableCaption>
      <TableHeader>
        <TableRow testID="header-row">
          <TableHead testID="head">
            <Text>Invoice</Text>
          </TableHead>
          <TableHead>
            <Text>Amount</Text>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow testID="first" onPress={onRow}>
          <TableCell testID="cell">
            <Text>INV001</Text>
          </TableCell>
          <TableCell>
            <Text>250.00</Text>
          </TableCell>
        </TableRow>
        <TableRow testID="last" aria-selected>
          <TableCell>
            <Text>INV002</Text>
          </TableCell>
          <TableCell>
            <Text>150.00</Text>
          </TableCell>
        </TableRow>
      </TableBody>
      <TableFooter testID="footer">
        <TableRow testID="footer-row">
          <TableCell>
            <Text>Total</Text>
          </TableCell>
          <TableCell>
            <Text>400.00</Text>
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>,
  );
}

describe('Table', () => {
  it('is a table of row groups, rows, column headers and cells', async () => {
    await renderInvoices();

    expect(screen.getByTestId('table').props.role).toBe('table');
    expect(screen.getByTestId('first').props.role).toBe('row');
    expect(screen.getByTestId('cell').props.role).toBe('cell');
    expect(screen.getByTestId('head').props.role).toBe('columnheader');
    expect(screen.getByTestId('header-row')).toContainElement(screen.getByTestId('head'));
  });

  it('lays each row out with its cells sharing its width, a border under every row but the last of a group', async () => {
    await renderInvoices();

    expect(classesOf('first')).toEqual(expect.arrayContaining(['flex-row', 'border-b']));
    expect(classesOf('cell')).toEqual(expect.arrayContaining(['flex-1', 'justify-center', 'p-2']));
    expect(classesOf('last')).toContain('border-b-0');
    expect(classesOf('footer-row')).toContain('border-b-0');
    expect(classesOf('first')).not.toContain('border-b-0');
  });

  it('draws headers in the foreground and medium weight, the cells small, and the footer on a muted band', async () => {
    await renderInvoices();

    expect(emittedClasses(screen.getByText('Invoice').props.className)).toEqual(
      expect.arrayContaining(['text-foreground', 'font-sans-medium', 'text-sm']),
    );
    expect(emittedClasses(screen.getByText('INV001').props.className)).toContain('text-sm');
    expect(classesOf('footer')).toEqual(expect.arrayContaining(['bg-muted/50', 'border-t']));
    expect(emittedClasses(screen.getByText('Total').props.className)).toContain('font-sans-medium');
  });

  it('draws a selected row on the muted background and announces it selected', async () => {
    await renderInvoices();

    expect(classesOf('last')).toContain('bg-muted');
    expect(screen.getByTestId('last').props.accessibilityState).toMatchObject({ selected: true });
    expect(classesOf('first')).not.toContain('bg-muted');
  });

  it('calls onPress of the row pressed', async () => {
    const onRow = jest.fn();
    await renderInvoices(onRow);

    await userEvent.setup().press(screen.getByTestId('first'));

    expect(onRow).toHaveBeenCalledTimes(1);
  });

  it('puts the caption below the table, muted', async () => {
    await renderInvoices();

    const table = screen.getByTestId('table');
    const caption = screen.getByText('Recent invoices');
    expect(table.children.at(-1)).toBe(caption);
    expect(emittedClasses(caption.props.className)).toEqual(expect.arrayContaining(['text-muted-foreground', 'mt-4']));
  });
});
