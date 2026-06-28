import type { Meta, StoryObj } from '@storybook/react-vite';

import { Meteors } from '@zeroxsolutions/ui/components/ui/meteors';

/**
 * `Meteors` is a decorative background effect that renders a configurable number
 * of absolutely-positioned streaks animating diagonally across their container.
 * The `number`, delay, duration, and `angle` props control the density and motion.
 * Place it inside a `relative`, `overflow-hidden` element so the meteors are
 * clipped to that region.
 */
const meta: Meta<typeof Meteors> = {
  title: 'Primitives/Meteors',
  component: Meteors,
};
export default meta;

type Story = StoryObj<typeof Meteors>;

/** Twenty meteors animating inside a fixed-size, relatively positioned, clipped container. */
export const Default: Story = {
  render: () => (
    <div className="relative h-64 w-96 overflow-hidden rounded-lg border bg-background">
      <Meteors number={20} />
    </div>
  ),
};
