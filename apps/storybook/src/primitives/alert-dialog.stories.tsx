import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@zeroxsolutions/ui/alert-dialog';
import { Button } from '@zeroxsolutions/ui/button';
import { TrashIcon } from 'lucide-react';

/**
 * `AlertDialog` is a modal, built from Base UI alert-dialog parts, that
 * interrupts the user to confirm a consequential action and blocks interaction
 * with the rest of the page until a choice is made. Compose `AlertDialogTrigger`,
 * `AlertDialogContent`, the header/footer slots, and the `Cancel` / `Action`
 * buttons to assemble the dialog; an optional `AlertDialogMedia` slot adds a
 * leading icon and `size="sm"` switches to a compact, centered layout.
 */
const meta: Meta<typeof AlertDialog> = {
  title: 'Primitives/AlertDialog',
  component: AlertDialog,
};
export default meta;

type Story = StoryObj<typeof AlertDialog>;

/**
 * Destructive confirmation flow: a trigger button opens the dialog with a
 * title, description, and Cancel / Delete actions.
 */
export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="destructive">Delete project</Button>}
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the project and all of its files. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

/**
 * Compact `size="sm"` variant whose header leads with an `AlertDialogMedia`
 * icon above a centered title and description.
 */
export const WithMedia: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="outline">Remove file</Button>}
      />
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TrashIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Remove this file?</AlertDialogTitle>
          <AlertDialogDescription>
            The file will be moved to trash and removed after 30 days.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Remove</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};
