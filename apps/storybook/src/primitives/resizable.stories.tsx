import type { Meta, StoryObj } from '@storybook/react-vite';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@chiselart/ui/resizable';

const meta: Meta<typeof ResizablePanelGroup> = {
  title: 'Primitives/Resizable',
  component: ResizablePanelGroup,
};
export default meta;

type Story = StoryObj<typeof ResizablePanelGroup>;

export const Default: Story = {
  render: () => (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-40 w-full rounded-md ring-1 ring-foreground/10"
    >
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-4 text-sm">
          Panel one
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-4 text-sm">
          Panel two
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};
