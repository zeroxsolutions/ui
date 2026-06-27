import type { Meta, StoryObj } from '@storybook/react-vite';

import { Slider } from '@zeroxsolutions/ui/slider';

/**
 * `Slider` wraps the Base UI slider primitive to let users pick a numeric value
 * by dragging a thumb along a track. Pass a scalar `defaultValue` for a single
 * thumb or an array of two for a range; `min`, `max`, and `step` bound and
 * quantize the selectable values.
 */
const meta: Meta<typeof Slider> = {
  title: 'Primitives/Slider',
  component: Slider,
};
export default meta;

type Story = StoryObj<typeof Slider>;

/** Single-thumb slider driven by a scalar `defaultValue`. */
export const Default: Story = {
  render: () => (
    <Slider defaultValue={50} max={100} step={1} className="w-64" />
  ),
};

/** Two-thumb range selection from an array `defaultValue` of lower and upper bounds. */
export const Range: Story = {
  render: () => (
    <Slider defaultValue={[25, 75]} max={100} step={1} className="w-64" />
  ),
};
