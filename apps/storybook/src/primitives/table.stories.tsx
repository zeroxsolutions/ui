import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@zeroxsolutions/ui/components/ui/table';

/**
 * `Table` and its sub-components (`TableHeader`, `TableBody`, `TableRow`,
 * `TableHead`, `TableCell`, `TableCaption`) are styled wrappers over native HTML
 * table elements, rendered inside a horizontally scrollable container. Compose
 * them to lay out tabular data with consistent spacing, borders, and row hover
 * states.
 */
const meta: Meta<typeof Table> = {
  title: 'Primitives/Table',
  component: Table,
};
export default meta;

type Story = StoryObj<typeof Table>;

const invoices = [
  {
    invoice: 'INV001',
    status: 'Paid',
    method: 'Credit Card',
    amount: '$250.00',
  },
  {
    invoice: 'INV002',
    status: 'Pending',
    method: 'Wire transfer',
    amount: '$150.00',
  },
  {
    invoice: 'INV003',
    status: 'Unpaid',
    method: 'Bank Transfer',
    amount: '$350.00',
  },
];

/** A basic invoice table composing the caption, header, body, rows, and cells. */
export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((row) => (
          <TableRow key={row.invoice}>
            <TableCell className="font-medium">{row.invoice}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell>{row.method}</TableCell>
            <TableCell className="text-right">{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
