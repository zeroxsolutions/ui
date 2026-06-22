import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTable, DataTableColumnHeader } from '@chiselart/ui';

type Person = { name: string; role: string; email: string };

const data: Person[] = [
  { name: 'Ada Lovelace', role: 'Engineer', email: 'ada@chiselart.dev' },
  { name: 'Alan Turing', role: 'Researcher', email: 'alan@chiselart.dev' },
  { name: 'Grace Hopper', role: 'Admiral', email: 'grace@chiselart.dev' },
  {
    name: 'Katherine Johnson',
    role: 'Mathematician',
    email: 'kj@chiselart.dev',
  },
  { name: 'Margaret Hamilton', role: 'Engineer', email: 'mh@chiselart.dev' },
];

const columns: ColumnDef<Person>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    meta: { label: 'Name' },
  },
  { accessorKey: 'role', header: 'Role', meta: { label: 'Role' } },
  { accessorKey: 'email', header: 'Email', meta: { label: 'Email' } },
];

const meta: Meta = {
  title: 'Components/DataTable',
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div className="w-[640px]">
      <DataTable
        columns={columns}
        data={data}
        filterColumn="name"
        enableHiding
        pageSize={3}
      />
    </div>
  ),
};
