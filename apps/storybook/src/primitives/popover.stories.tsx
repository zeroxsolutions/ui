import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@zeroxsolutions/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@zeroxsolutions/ui/popover';

/**
 * `Popover` is a Base UI overlay that anchors floating content to a trigger
 * element and renders it in a portal, positioned relative to that trigger. It
 * is composed from `PopoverTrigger`, `PopoverContent`, and the optional
 * `PopoverHeader` / `PopoverTitle` / `PopoverDescription` slots. Use it for
 * transient, non-modal content such as inline settings or detail panels.
 */
const meta: Meta<typeof Popover> = {
  title: 'Primitives/Popover',
  component: Popover,
};
export default meta;

type Story = StoryObj<typeof Popover>;

/** Baseline popover: an outline button trigger that opens a card with a title and description. */
export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline">Open popover</Button>}
      />
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>
            Set the width and height for the selected layer.
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
};
