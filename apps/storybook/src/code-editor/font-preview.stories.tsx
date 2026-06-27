import type { Meta, StoryObj } from '@storybook/react-vite';

import { FontPreview } from '@zeroxsolutions/ui/font-preview';

const INTER = 'https://rsms.me/inter/font-files/InterVariable.woff2?v=4.1';

/**
 * `FontPreview` renders a type specimen of a font file at several sizes by
 * injecting a `@font-face` scoped to the instance. Point `src` at a font URL or
 * data URL; `sizes` sets the size scale and `children` overrides the default
 * pangram. It owns only the spacing between rows, so the stories wrap it in a
 * padded, bordered container.
 */
const meta: Meta<typeof FontPreview> = {
  title: 'Code Editor/FontPreview',
  component: FontPreview,
};
export default meta;

type Story = StoryObj<typeof FontPreview>;

/** Loads a variable font from a URL and renders the default pangram across the built-in size scale. */
export const Default: Story = {
  render: () => (
    <div className="w-[32rem] rounded-lg border p-4">
      <FontPreview src={INTER} />
    </div>
  ),
};

/** Overrides the specimen text via `children` and narrows the scale to two custom `sizes`. */
export const CustomSpecimen: Story = {
  render: () => (
    <div className="w-[32rem] rounded-lg border p-4">
      <FontPreview src={INTER} sizes={[28, 16]}>
        The quick brown fox jumps over the lazy dog
      </FontPreview>
    </div>
  ),
};
