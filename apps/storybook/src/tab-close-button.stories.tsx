import type { Meta, StoryObj } from '@storybook/react-vite';

import { TabCloseButton } from '@zeroxsolutions/ui/tab-close-button';

const meta: Meta<typeof TabCloseButton> = {
  title: 'Components/TabCloseButton',
  component: TabCloseButton,
};
export default meta;

type Story = StoryObj<typeof TabCloseButton>;

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-sm">
      <span className="flex items-center gap-1">
        Dirty
        <TabCloseButton dirty revealClose={false} onClose={() => {}} />
      </span>
      <span className="flex items-center gap-1">
        Dirty + hover/active
        <TabCloseButton dirty revealClose onClose={() => {}} />
      </span>
      <span className="flex items-center gap-1">
        Clean
        <TabCloseButton dirty={false} revealClose onClose={() => {}} />
      </span>
    </div>
  ),
};
