import type { Meta, StoryObj } from '@storybook/react-vite';
import { Settings2 } from 'lucide-react';

import { PopoverIconButton } from '@zeroxsolutions/ui/popover-icon-button';

/**
 * `PopoverIconButton` is a ghost icon button that pairs a hover/focus tooltip
 * with a click-to-open popover, owning the fixed Popover > Tooltip > Button
 * composition so the tooltip labels the trigger without stealing its click. Use
 * it for "settings / advanced" affordances; the caller supplies only the trigger
 * glyph, tooltip text, popover body, and optional placement and classes.
 */
const meta: Meta<typeof PopoverIconButton> = {
  title: 'Components/PopoverIconButton',
  component: PopoverIconButton,
};
export default meta;

type Story = StoryObj<typeof PopoverIconButton>;

/** Settings glyph with a tooltip and a popover body opened on click. */
export const Default: Story = {
  render: () => (
    <PopoverIconButton
      tooltip="Advanced settings"
      ariaLabel="Advanced settings"
      icon={<Settings2 className="size-4" />}
      contentClassName="w-56"
    >
      <div className="space-y-1 text-sm">
        <p className="font-medium">Advanced</p>
        <p className="text-muted-foreground">Body content goes here.</p>
      </div>
    </PopoverIconButton>
  ),
};
