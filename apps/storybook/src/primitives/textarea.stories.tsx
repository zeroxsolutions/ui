import type { Meta, StoryObj } from '@storybook/react-vite';

import { Textarea } from '@chiselart/ui/textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Primitives/Textarea',
  component: Textarea,
};
export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  render: () => <Textarea placeholder="Type your message here." className="w-80" />,
};

export const Disabled: Story = {
  render: () => (
    <Textarea placeholder="Type your message here." className="w-80" disabled />
  ),
};
