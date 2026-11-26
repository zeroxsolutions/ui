import { render, screen, userEvent } from '@testing-library/react-native';
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table';
import { Button } from './button';
import { Text } from './text';

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

  it('announces a selected row selected', async () => {
    await renderInvoices();

    expect(screen.getByTestId('last').props.accessibilityState).toMatchObject({ selected: true });
  });

  it('calls onPress of the row pressed', async () => {
    const onRow = jest.fn();
    await renderInvoices(onRow);

    await userEvent.setup().press(screen.getByTestId('first'));

    expect(onRow).toHaveBeenCalledTimes(1);
  });

  it('puts the caption below the table', async () => {
    await renderInvoices();

    const table = screen.getByTestId('table');
    const caption = screen.getByText('Recent invoices');
    expect(table.children.at(-1)).toBe(caption);
  });

  it('leaves a control in a cell of a row with no onPress reachable on its own', async () => {
    await render(
      <Table>
        <TableBody>
          <TableRow testID="row">
            <TableCell>
              <Button aria-label="Delete INV001">
                <Text>Delete</Text>
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByTestId('row').props.accessible).toBe(false);
    expect(screen.getByRole('button', { name: 'Delete INV001' })).toBeOnTheScreen();
  });

  it('makes a row with onPress one element that takes the press', async () => {
    await render(
      <Table>
        <TableBody>
          <TableRow testID="row" onPress={() => undefined}>
            <TableCell>
              <Text>INV001</Text>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByTestId('row').props.accessible).toBe(true);
  });
});
