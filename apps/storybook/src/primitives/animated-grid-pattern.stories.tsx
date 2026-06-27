import type { Meta, StoryObj } from '@storybook/react-vite';

import { AnimatedGridPattern } from '@zeroxsolutions/ui/animated-grid-pattern';

/**
 * `AnimatedGridPattern` is a decorative SVG background that tiles a line grid
 * and fades randomly placed squares in and out to add subtle motion behind
 * content. It absolutely fills its nearest positioned ancestor and is
 * `pointer-events-none` / `aria-hidden`, so it must be wrapped in a relative,
 * overflow-clipped container. Use `numSquares`, `maxOpacity`, `duration`, and
 * the grid `width`/`height` to tune density and animation.
 */
const meta: Meta<typeof AnimatedGridPattern> = {
  title: 'Primitives/AnimatedGridPattern',
  component: AnimatedGridPattern,
};
export default meta;

type Story = StoryObj<typeof AnimatedGridPattern>;

/**
 * Renders the pattern inside a relative, overflow-clipped container with 30
 * squares animating at half opacity.
 */
export const Default: Story = {
  render: () => (
    <div className="relative h-64 w-96 overflow-hidden rounded-lg border bg-background">
      <AnimatedGridPattern numSquares={30} maxOpacity={0.5} />
    </div>
  ),
};
