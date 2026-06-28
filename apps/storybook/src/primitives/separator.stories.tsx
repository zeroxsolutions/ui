import type { Meta, StoryObj } from '@storybook/react-vite';

import { Separator } from '@zeroxsolutions/ui/components/ui/separator';

/**
 * `Separator` is a Base UI separator that renders a thin divider line to group
 * or delimit content. It defaults to a full-width horizontal rule and switches
 * to a self-stretching vertical rule via the `orientation` prop, making it
 * suitable both between stacked blocks and between inline items in a row.
 */
const meta: Meta<typeof Separator> = {
  title: 'Primitives/Separator',
  component: Separator,
};
export default meta;

type Story = StoryObj<typeof Separator>;

/** Default horizontal orientation dividing two stacked blocks of content. */
export const Horizontal: Story = {
  render: () => (
    <div className="w-64">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Design system</h4>
        <p className="text-sm text-muted-foreground">A design system.</p>
      </div>
      <Separator className="my-4" />
      <p className="text-sm text-muted-foreground">
        Below the divider sits another block of content.
      </p>
    </div>
  ),
};

/** Vertical orientation (`orientation="vertical"`) separating inline items in a row. */
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
