import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  Button,
} from '@chiselart/ui';

const meta: Meta<typeof Drawer> = {
  title: 'Primitives/Drawer',
  component: Drawer,
};
export default meta;

type Story = StoryObj<typeof Drawer>;

export const Default: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline">Open drawer</Button>} />
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
          <DrawerClose render={<Button variant="outline">Cancel</Button>} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const RightSide: Story = {
  render: () => (
    <Drawer direction="right">
      <DrawerTrigger render={<Button variant="outline">Open side panel</Button>} />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>Refine the results shown in the list.</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 text-sm text-muted-foreground">Panel body content.</div>
        <DrawerFooter>
          <Button>Apply</Button>
          <DrawerClose render={<Button variant="outline">Close</Button>} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};
