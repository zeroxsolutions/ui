import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@zeroxsolutions/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@zeroxsolutions/ui/drawer';

/**
 * `Drawer` is a modal panel built on the `vaul` primitive that slides in from a
 * screen edge and traps focus while open. Compose it from `DrawerTrigger`,
 * `DrawerContent` (portaled over a dimming overlay), and the header/footer
 * slots; the `direction` prop selects which edge it enters from, and the bottom
 * variant exposes a drag handle for swipe-to-dismiss.
 */
const meta: Meta<typeof Drawer> = {
  title: 'Primitives/Drawer',
  component: Drawer,
};
export default meta;

type Story = StoryObj<typeof Drawer>;

/**
 * Default bottom-edge drawer with a title, description, body copy, and
 * confirm / cancel footer actions; shows the drag handle and swipe-to-dismiss
 * affordance.
 */
export const Default: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Are you absolutely sure?</DrawerTitle>
          <DrawerDescription>
            This action cannot be undone. This will permanently remove the item.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 text-sm text-muted-foreground">
          Drag the handle or swipe down to dismiss.
        </div>
        <DrawerFooter>
          <Button>Confirm</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

/**
 * Side-panel layout using `direction="right"`, anchoring the drawer to the
 * right edge as a filter sheet instead of the default bottom sheet.
 */
export const RightSide: Story = {
  render: () => (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline">Open side panel</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>
            Refine the results shown in the list.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 text-sm text-muted-foreground">
          Panel body content.
        </div>
        <DrawerFooter>
          <Button>Apply</Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};
