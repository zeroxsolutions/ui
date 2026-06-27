import type { Meta, StoryObj } from '@storybook/react-vite';

import { ConfirmButton } from '@zeroxsolutions/ui/confirm-button';

/**
 * `ConfirmButton` is a trigger button that gates its action behind an
 * `AlertDialog` confirmation step. It owns its own open-state, so each
 * destructive row in a list gets an independent confirm without the parent
 * juggling one dialog per row. The `onConfirm` callback runs only after the user
 * accepts.
 */
const meta: Meta<typeof ConfirmButton> = {
  title: 'Components/ConfirmButton',
  component: ConfirmButton,
};
export default meta;

type Story = StoryObj<typeof ConfirmButton>;

/** The `destructive` flag rendering the confirm action in the red variant for an irreversible action. */
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
};

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
};
