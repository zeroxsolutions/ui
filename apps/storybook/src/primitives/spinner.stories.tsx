import type { Meta, StoryObj } from '@storybook/react-vite';

import { Spinner } from '@zeroxsolutions/ui/spinner';

/**
 * `Spinner` renders an animated, spinning loader icon to signal an in-progress or
 * loading state. It is an SVG with `role="status"` and `aria-label="Loading"`,
 * defaulting to a `size-4` footprint; pass a sizing `className` to scale it.
 */
const meta: Meta<typeof Spinner> = {
  title: 'Primitives/Spinner',
  component: Spinner,
};
export default meta;

type Story = StoryObj<typeof Spinner>;

/** The spinner at its default `size-4` dimensions. */
export const Default: Story = {
  render: () => <Spinner />,
};

/** The spinner scaled to several footprints via `size-*` utility classes. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner className="size-4" />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
    </div>
  ),
};
