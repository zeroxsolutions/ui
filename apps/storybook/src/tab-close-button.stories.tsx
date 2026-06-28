import type { Meta, StoryObj } from '@storybook/react-vite';

import { TabCloseButton } from '@zeroxsolutions/ui/components/tab-close-button';

/**
 * `TabCloseButton` is the trailing control on an editor tab: a dirty buffer
 * shows an unsaved-changes dot that swaps to an × close affordance on hover or
 * whenever the tab is active. It always renders a ghost icon `Button` and stops
 * click propagation so closing the tab never doubles as selecting it.
 */
const meta: Meta<typeof TabCloseButton> = {
  title: 'Components/TabCloseButton',
  component: TabCloseButton,
};
export default meta;

type Story = StoryObj<typeof TabCloseButton>;

/**
 * The three resting states side by side: a dirty tab showing the unsaved dot,
 * the same tab with `revealClose` forcing the ×, and a clean tab whose × is
 * always shown.
 */
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
