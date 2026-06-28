import type { Meta, StoryObj } from '@storybook/react-vite';

import { ScrollArea } from '@zeroxsolutions/ui/components/ui/scroll-area';

/**
 * `ScrollArea` wraps content in a fixed-size viewport and renders a custom,
 * cross-browser scrollbar with a styled thumb in place of the native one. Use
 * it whenever content can overflow a bounded container (lists, menus, panels)
 * and a consistent scrollbar appearance is required; the host element sets the
 * height/width that triggers scrolling.
 */
const meta: Meta<typeof ScrollArea> = {
  title: 'Primitives/ScrollArea',
  component: ScrollArea,
};
export default meta;

type Story = StoryObj<typeof ScrollArea>;

/** A list taller than its fixed-height box, scrolled vertically via the styled scrollbar. */
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
