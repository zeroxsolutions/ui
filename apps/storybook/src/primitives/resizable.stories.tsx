import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@zeroxsolutions/ui/resizable';

/**
 * `ResizablePanelGroup` lays out one or more `ResizablePanel`s along a
 * horizontal or vertical axis, separated by a draggable `ResizableHandle` that
 * lets the user redistribute space between adjacent panels. Use it for split
 * views such as editor/preview or sidebar/content where the divider position is
 * user-controlled; pass `withHandle` to render the grab affordance on the
 * separator.
 */
const meta: Meta<typeof ResizablePanelGroup> = {
  title: 'Primitives/Resizable',
  component: ResizablePanelGroup,
};
export default meta;

type Story = StoryObj<typeof ResizablePanelGroup>;

/** Two equal panels split horizontally, with a grabbable handle between them. */
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
