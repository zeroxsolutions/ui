import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@zeroxsolutions/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@zeroxsolutions/ui/tooltip';

/**
 * `Tooltip` is a Base UI popup that reveals a short hint when its trigger is
 * hovered or focused. Wrap one or more triggers in a `TooltipProvider` to share
 * the open/close delay, then pair a `TooltipTrigger` with `TooltipContent`. The
 * content is portalled and positioned relative to the trigger via the `side`
 * prop.
 */
const meta: Meta<typeof Tooltip> = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
};
export default meta;

type Story = StoryObj<typeof Tooltip>;

/** Default placement: content opens above the trigger (the `top` side). */
export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
        <TooltipContent>Add to library</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

/** Bottom placement: `side="bottom"` flips the popup and arrow below the trigger. */
export const Bottom: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
        <TooltipContent side="bottom">Shown below the trigger</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
