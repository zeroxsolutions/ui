import type { Meta, StoryObj } from '@storybook/react-vite';

import { Meteors } from '@chiselart/ui/meteors';

const meta: Meta<typeof Meteors> = {
  title: 'Primitives/Meteors',
  component: Meteors,
};
export default meta;

type Story = StoryObj<typeof Meteors>;

export const Default: Story = {
  render: () => (
    <div className="relative h-64 w-96 overflow-hidden rounded-lg border bg-background">
      <Meteors number={20} />
    </div>
  ),
};
