import type { Meta, StoryObj } from '@storybook/react-vite';

import { ImagePreview } from '@chiselart/ui/image-preview';

const SAMPLE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160">' +
      '<rect width="240" height="160" rx="12" fill="#6366f1"/>' +
      '<circle cx="120" cy="80" r="44" fill="#fbbf24"/></svg>',
  );

const meta: Meta<typeof ImagePreview> = {
  title: 'Code Editor/ImagePreview',
  component: ImagePreview,
};
export default meta;

type Story = StoryObj<typeof ImagePreview>;

export const Default: Story = {
  render: () => (
    <div className="h-72 w-96 rounded-lg border">
      <ImagePreview src={SAMPLE} alt="Sample artwork" />
    </div>
  ),
};
