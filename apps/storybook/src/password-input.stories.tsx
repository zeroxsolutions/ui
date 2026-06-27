import type { Meta, StoryObj } from '@storybook/react-vite';

import { PasswordInput } from '@zeroxsolutions/ui/password-input';

const meta: Meta<typeof PasswordInput> = {
  title: 'Components/PasswordInput',
  component: PasswordInput,
};
export default meta;

type Story = StoryObj<typeof PasswordInput>;

export const Default: Story = {
  render: () => <PasswordInput placeholder="Password" className="w-64" />,
};

export const WithValue: Story = {
  render: () => (
    <PasswordInput
      defaultValue="hunter2"
      placeholder="Password"
      className="w-64"
    />
  ),
};
