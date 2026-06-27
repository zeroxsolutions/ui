import type { Meta, StoryObj } from '@storybook/react-vite';

import { FontPreview } from '@zeroxsolutions/ui/font-preview';

const INTER = 'https://rsms.me/inter/font-files/InterVariable.woff2?v=4.1';

const meta: Meta<typeof FontPreview> = {
  title: 'Code Editor/FontPreview',
  component: FontPreview,
};
export default meta;

type Story = StoryObj<typeof FontPreview>;

export const Default: Story = {
  render: () => (
    <div className="w-[32rem] rounded-lg border p-4">
      <FontPreview src={INTER} />
    </div>
  ),
};

export const CustomSpecimen: Story = {
  render: () => (
    <div className="w-[32rem] rounded-lg border p-4">
      <FontPreview src={INTER} sizes={[28, 16]}>
        Chisel — design at the speed of thought
      </FontPreview>
    </div>
  ),
};
