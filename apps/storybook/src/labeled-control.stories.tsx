import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from '@chiselart/ui/input';
import { LabeledControl } from '@chiselart/ui/labeled-control';

const meta: Meta<typeof LabeledControl> = {
  title: 'Layouts/LabeledControl',
  component: LabeledControl,
};
export default meta;

type Story = StoryObj<typeof LabeledControl>;

export const Default: Story = {
  render: () => (
    <div className="w-56 space-y-3">
      <LabeledControl label="Fill">
        <div className="h-8 rounded bg-[#0099ff] ring-1 ring-foreground/10" />
      </LabeledControl>
      <LabeledControl label="Name">
        <Input placeholder="Untitled" />
      </LabeledControl>
    </div>
  ),
};
