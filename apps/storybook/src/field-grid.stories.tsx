import type { Meta, StoryObj } from '@storybook/react-vite';

import { FieldGrid } from '@chiselart/ui/field-grid';
import { Input } from '@chiselart/ui/input';

const meta: Meta<typeof FieldGrid> = {
  title: 'Layouts/FieldGrid',
  component: FieldGrid,
};
export default meta;

type Story = StoryObj<typeof FieldGrid>;

export const TwoColumns: Story = {
  render: () => (
    <div className="w-64">
      <FieldGrid>
        <Input placeholder="X" />
        <Input placeholder="Y" />
        <Input placeholder="W" />
        <Input placeholder="H" />
      </FieldGrid>
    </div>
  ),
};

export const ThreeColumns: Story = {
  render: () => (
    <div className="w-72">
      <FieldGrid cols={3}>
        <Input placeholder="Count" />
        <Input placeholder="Gutter" />
        <Input placeholder="Margin" />
      </FieldGrid>
    </div>
  ),
};
