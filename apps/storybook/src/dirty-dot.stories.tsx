import type { Meta, StoryObj } from '@storybook/react-vite';

import { DirtyDot } from '@zeroxsolutions/ui/dirty-dot';

const meta: Meta<typeof DirtyDot> = {
  title: 'Components/DirtyDot',
  component: DirtyDot,
};
export default meta;

type Story = StoryObj<typeof DirtyDot>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-sm">
      <DirtyDot />
      <span>file.ts — unsaved</span>
    </div>
  ),
};
