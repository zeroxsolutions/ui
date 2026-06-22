import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@chiselart/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@chiselart/ui/tooltip';

const meta: Meta<typeof Tooltip> = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
};
export default meta;

type Story = StoryObj<typeof Tooltip>;

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
