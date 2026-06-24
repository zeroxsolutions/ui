import type { Meta, StoryObj } from '@storybook/react-vite'
import { Settings2 } from 'lucide-react'

import { PopoverIconButton } from '@chiselart/ui/popover-icon-button'

const meta: Meta<typeof PopoverIconButton> = {
  title: 'Components/PopoverIconButton',
  component: PopoverIconButton,
}
export default meta

type Story = StoryObj<typeof PopoverIconButton>

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
}
