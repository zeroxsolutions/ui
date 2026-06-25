import type { Meta, StoryObj } from '@storybook/react-vite'

import { ConfirmButton } from '@chiselart/ui/confirm-button'

const meta: Meta<typeof ConfirmButton> = {
  title: 'Components/ConfirmButton',
  component: ConfirmButton,
}
export default meta

type Story = StoryObj<typeof ConfirmButton>

export const Destructive: Story = {
  render: () => (
    <ConfirmButton
      title="Clear all conversations?"
      description="This permanently removes every conversation on this device."
      actionLabel="Clear"
      destructive
      onConfirm={() => {}}
    >
      Clear
    </ConfirmButton>
  ),
}

/** `cancelLabel` overrides the dismissing button's copy (defaults to "Cancel"). */
export const CustomCancelLabel: Story = {
  render: () => (
    <ConfirmButton
      title="Discard changes?"
      description="Your edits will be lost."
      actionLabel="Discard"
      cancelLabel="Keep editing"
      destructive
      onConfirm={() => {}}
    >
      Discard
    </ConfirmButton>
  ),
}
