import type { Meta, StoryObj } from '@storybook/react-vite';

import { Skeleton } from '@zeroxsolutions/ui/components/ui/skeleton';

/**
 * `Skeleton` is a presentational placeholder that renders a pulsing, muted block
 * to stand in for content while it loads. It carries no intrinsic dimensions:
 * callers size and shape it through `className`, so the stories compose several
 * instances to mock real layouts such as avatars and lines of text.
 */
const meta: Meta<typeof Skeleton> = {
  title: 'Primitives/Skeleton',
  component: Skeleton,
};
export default meta;

type Story = StoryObj<typeof Skeleton>;

/** A single skeleton block sized into a simple bar via `className`. */
export const Default: Story = {
  render: () => <Skeleton className="h-10 w-48" />,
};

/**
 * Composes a circular and several bar-shaped skeletons to mock a card row with
 * an avatar and two lines of text.
 */
export const Card: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  ),
};
