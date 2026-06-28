import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@zeroxsolutions/ui/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@zeroxsolutions/ui/components/ui/sheet';

/**
 * `Sheet` is a Base UI Dialog rendered as a panel that slides in from a screen
 * edge over a backdrop. Use it for transient, focused tasks—editing, navigation,
 * or details—without leaving the current page. It composes a trigger, header
 * (title and description), body, and footer; the `side` prop selects which edge
 * the panel enters from.
 */
const meta: Meta<typeof Sheet> = {
  title: 'Primitives/Sheet',
  component: Sheet,
};
export default meta;

type Story = StoryObj<typeof Sheet>;

/** Default panel sliding in from the right edge, with a titled header and a footer save action. */
export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline">Open sheet</Button>} />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose render={<Button>Save changes</Button>} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

/** `side="left"` makes the panel slide in from the left edge for navigation-style content. */
export const LeftSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger
        render={<Button variant="outline">Open from left</Button>}
      />
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>
            A panel that slides in from the left edge.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};
