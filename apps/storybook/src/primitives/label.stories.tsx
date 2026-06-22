import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from '@chiselart/ui/input';
import { Label } from '@chiselart/ui/label';

const meta: Meta<typeof Label> = {
  title: 'Primitives/Label',
  component: Label,
};
export default meta;

type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};
