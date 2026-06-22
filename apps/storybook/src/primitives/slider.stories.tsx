import type { Meta, StoryObj } from '@storybook/react-vite';

import { Slider } from '@chiselart/ui/slider';

const meta: Meta<typeof Slider> = {
  title: 'Primitives/Slider',
  component: Slider,
};
export default meta;

type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  render: () => <Slider defaultValue={50} max={100} step={1} className="w-64" />,
};

export const Range: Story = {
  render: () => (
    <Slider defaultValue={[25, 75]} max={100} step={1} className="w-64" />
  ),
};
