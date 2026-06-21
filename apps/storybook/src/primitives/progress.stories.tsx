import type { Meta, StoryObj } from '@storybook/react-vite';

import { Progress, ProgressLabel, ProgressValue } from '@chiselart/ui';

const meta: Meta<typeof Progress> = {
  title: 'Primitives/Progress',
  component: Progress,
};
export default meta;

type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  render: () => <Progress value={60} className="w-64" />,
};

export const WithLabel: Story = {
  render: () => (
    <Progress value={42} className="w-64">
      <ProgressLabel>Uploading</ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
};
