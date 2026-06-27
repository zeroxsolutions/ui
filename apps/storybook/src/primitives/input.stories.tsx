import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from '@zeroxsolutions/ui/input';

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: () => <Input placeholder="Email" className="w-64" />,
};

export const Disabled: Story = {
  render: () => (
    <Input
      placeholder="Disabled"
      defaultValue="hello@zeroxsolutions.dev"
      disabled
      className="w-64"
    />
  ),
};
