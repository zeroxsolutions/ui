import type { Meta, StoryObj } from '@storybook/react-vite';

import { AspectRatio } from '@zeroxsolutions/ui/components/ui/aspect-ratio';

/**
 * `AspectRatio` constrains its children to a fixed width-to-height ratio using
 * the CSS `aspect-ratio` property, driven by the numeric `ratio` prop. Use it
 * to reserve space for media (images, video, embeds) so the surrounding layout
 * stays stable before the content loads. The box fills the available width and
 * derives its height from the ratio.
 */
const meta: Meta<typeof AspectRatio> = {
  title: 'Primitives/AspectRatio',
  component: AspectRatio,
};
export default meta;

type Story = StoryObj<typeof AspectRatio>;

/** Demonstrates a 16:9 widescreen ratio wrapping an image that fills and crops to the box via `object-cover`. */
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

/** Shows a 1:1 square ratio with placeholder text centered inside the reserved box. */
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
