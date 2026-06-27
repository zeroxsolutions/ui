import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@zeroxsolutions/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@zeroxsolutions/ui/dialog';
import { Field, FieldLabel } from '@zeroxsolutions/ui/field';
import { Input } from '@zeroxsolutions/ui/input';

/**
 * `Dialog` is a modal built on the Base UI dialog primitive: a trigger opens a
 * focus-trapped popup over a backdrop, composed from header, title, description,
 * footer, and close parts. Use it for confirmations or short focused tasks that
 * must interrupt the current flow. The parts are slots, so the consumer supplies
 * all visible copy.
 */
const meta: Meta<typeof Dialog> = {
  title: 'Primitives/Dialog',
  component: Dialog,
};
export default meta;

type Story = StoryObj<typeof Dialog>;

/**
 * Baseline informational dialog: title and description in the header, with
 * cancel and confirm actions in the footer that both close the dialog.
 */
export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open dialog</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this project</DialogTitle>
          <DialogDescription>
            Anyone with the link will be able to view this project.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <DialogClose render={<Button>Copy link</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/**
 * Dialog wrapping an editable form field, showing how input lives between the
 * header and a footer pairing a cancel action with a save action.
 */
export const WithForm: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button>Edit profile</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="dialog-name">Name</FieldLabel>
          <Input id="dialog-name" defaultValue="Ada Lovelace" />
        </Field>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <DialogClose render={<Button>Save changes</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
