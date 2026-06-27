import type { Meta, StoryObj } from '@storybook/react-vite';

import { ImagePreview } from '@zeroxsolutions/ui/image-preview';

const SAMPLE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160">' +
      '<rect width="240" height="160" rx="12" fill="#6366f1"/>' +
      '<circle cx="120" cy="80" r="44" fill="#fbbf24"/></svg>',
  );

/**
 * `ImagePreview` contains an image asset within its container over a
 * checkerboard backdrop, so transparent pixels read clearly. It fills the space
 * it is given (the consumer sizes the wrapper) and forwards `className` and other
 * `img` props to the image; pass `alt` for the accessible name. The stories size
 * the wrapper and supply a sample asset.
 */
const meta: Meta<typeof ImagePreview> = {
  title: 'Code Editor/ImagePreview',
  component: ImagePreview,
};
export default meta;

type Story = StoryObj<typeof ImagePreview>;

/** Renders a sample SVG data-URL contained inside a fixed-size bordered wrapper, with an explicit `alt`. */
export const Default: Story = {
  render: () => (
    <div className="h-72 w-96 rounded-lg border">
      <ImagePreview src={SAMPLE} alt="Sample artwork" />
    </div>
  ),
};
