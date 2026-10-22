import { useState, type ReactNode } from 'react';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Text } from '@/components/ui/text';

const INVOICES = [
  { invoice: 'INV001', status: 'Paid', amount: '250.00' },
  { invoice: 'INV002', status: 'Pending', amount: '150.00' },
  { invoice: 'INV003', status: 'Unpaid', amount: '350.00' },
  { invoice: 'INV004', status: 'Paid', amount: '450.00' },
];

function TableDemo(): ReactNode {
  const [selected, setSelected] = useState('INV002');
  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Text>Invoice</Text>
          </TableHead>
          <TableHead>
            <Text>Status</Text>
          </TableHead>
          <TableHead className="items-end">
            <Text>Amount</Text>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {INVOICES.map(({ invoice, status, amount }) => (
          <TableRow key={invoice} aria-selected={invoice === selected} onPress={() => setSelected(invoice)}>
            <TableCell>
              <Text className="font-medium">{invoice}</Text>
            </TableCell>
            <TableCell>
              <Text>{status}</Text>
            </TableCell>
            <TableCell className="items-end">
              <Text>{amount}</Text>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className="flex-[2]">
            <Text>Total</Text>
          </TableCell>
          <TableCell className="items-end">
            <Text>1,200.00</Text>
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

export { TableDemo };
