import type { Meta, StoryObj } from '@storybook/react-vite';
import { MousePointer2, Square } from 'lucide-react';

import { ToolbarButton } from '@zeroxsolutions/ui/components/toolbar-button';

/**
 * `ToolbarButton` is an icon button for an editor toolbar, pairing an
 * active/selected state with a tooltip that surfaces the keyboard shortcut as a
 * `Kbd` chip. The caller supplies the icon, label, shortcut, and click handler;
 * the active state reuses the `secondary` button variant so a selected control
 * reads consistently across toolbars.
 */
const meta: Meta<typeof ToolbarButton> = {
  title: 'Components/ToolbarButton',
  component: ToolbarButton,
};
export default meta;

type Story = StoryObj<typeof ToolbarButton>;

/**
 * A two-button toolbar row contrasting the `active` selection highlight on the
 * first button with the default ghost styling of the second, each carrying its
 * own icon and shortcut.
 */
export const Toolbar: Story = {
  render: () => (
    <div className="flex items-center gap-1 rounded-md border p-1">
      <ToolbarButton label="Select" shortcut="V" icon={MousePointer2} active />
      <ToolbarButton label="Rectangle" shortcut="R" icon={Square} />
    </div>
  ),
};
