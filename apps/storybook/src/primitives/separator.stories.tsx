import type { Meta, StoryObj } from '@storybook/react-vite';

import { Separator } from '@chiselart/ui/separator';

const meta: Meta<typeof Separator> = {
  title: 'Primitives/Separator',
  component: Separator,
};
export default meta;

type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-64">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Chisel UI</h4>
        <p className="text-sm text-muted-foreground">A design system.</p>
      </div>
      <Separator className="my-4" />
      <p className="text-sm text-muted-foreground">
        Below the divider sits another block of content.
      </p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-6 items-center gap-4 text-sm">
      <span>Docs</span>
      <Separator orientation="vertical" />
      <span>Source</span>
      <Separator orientation="vertical" />
      <span>About</span>
    </div>
  ),
};
