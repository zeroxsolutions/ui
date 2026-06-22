import type { Meta, StoryObj } from '@storybook/react-vite';

import { AnimatedGridPattern } from '@chiselart/ui';

const meta: Meta<typeof AnimatedGridPattern> = {
  title: 'Components/AnimatedGridPattern',
  component: AnimatedGridPattern,
};
export default meta;

type Story = StoryObj<typeof AnimatedGridPattern>;

export const Default: Story = {
  render: () => (
    <div className="relative h-64 w-96 overflow-hidden rounded-lg border bg-background">
      <AnimatedGridPattern numSquares={30} maxOpacity={0.5} />
    </div>
  ),
};
