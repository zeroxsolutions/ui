import type { Meta, StoryObj } from '@storybook/react-vite';

import { AspectRatio } from '@chiselart/ui/aspect-ratio';

const meta: Meta<typeof AspectRatio> = {
  title: 'Primitives/AspectRatio',
  component: AspectRatio,
};
export default meta;

type Story = StoryObj<typeof AspectRatio>;

export const Widescreen: Story = {
  render: () => (
    <div className="w-[480px]">
      <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg">
        <img
          src="https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=800&dpr=2&q=80"
          alt="Drag racing"
          className="size-full object-cover"
        />
      </AspectRatio>
    </div>
  ),
};

export const Square: Story = {
  render: () => (
    <div className="w-[280px]">
      <AspectRatio
        ratio={1}
        className="flex items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground"
      >
        1 : 1
      </AspectRatio>
    </div>
  ),
};
