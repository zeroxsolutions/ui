import type { Meta, StoryObj } from '@storybook/react-vite';
import { MousePointer2, Square } from 'lucide-react';

import { ToolbarButton } from '@zeroxsolutions/ui/toolbar-button';

const meta: Meta<typeof ToolbarButton> = {
  title: 'Components/ToolbarButton',
  component: ToolbarButton,
};
export default meta;

type Story = StoryObj<typeof ToolbarButton>;

export const Toolbar: Story = {
  render: () => (
    <div className="flex items-center gap-1 rounded-md border p-1">
      <ToolbarButton label="Select" shortcut="V" icon={MousePointer2} active />
      <ToolbarButton label="Rectangle" shortcut="R" icon={Square} />
    </div>
  ),
};
