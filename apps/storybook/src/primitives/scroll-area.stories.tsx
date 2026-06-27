import type { Meta, StoryObj } from '@storybook/react-vite';

import { ScrollArea } from '@zeroxsolutions/ui/scroll-area';

const meta: Meta<typeof ScrollArea> = {
  title: 'Primitives/ScrollArea',
  component: ScrollArea,
};
export default meta;

type Story = StoryObj<typeof ScrollArea>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-48 w-64 rounded-md ring-1 ring-foreground/10">
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} className="text-sm">
            Layer {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};
