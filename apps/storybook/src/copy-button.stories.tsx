import type { Meta, StoryObj } from '@storybook/react-vite';

import { CopyButton } from '@zeroxsolutions/ui/components/copy-button';

/**
 * `CopyButton` copies a value to the clipboard and shows transient feedback — its
 * icon flips to a check and its accessible name to "Copied" for a moment, then
 * resets. It defaults to a `ghost` `icon-xs` button and forwards every `Button`
 * prop, so it reuses one implementation across code blocks, toolbars, and cards.
 */
const meta: Meta<typeof CopyButton> = {
  title: 'Components/CopyButton',
  component: CopyButton,
  args: { value: 'pnpm add @zeroxsolutions/ui' },
};
export default meta;

type Story = StoryObj<typeof CopyButton>;

export const Default: Story = {};

export const CustomLabel: Story = { args: { label: 'Copy source' } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <CopyButton {...args} size="icon-xs" />
      <CopyButton {...args} size="icon-sm" />
      <CopyButton {...args} size="icon" />
      <CopyButton {...args} variant="outline" size="icon-sm" />
    </div>
  ),
};

/** Composed into a bar, mirroring the code-block header usage. */
export const InlineInBar: Story = {
  render: (args) => (
    <div className="flex w-80 items-center gap-2 rounded-md border bg-card px-2 py-1.5 text-sm text-muted-foreground">
      <span className="flex-1 truncate font-mono">pnpm add @zeroxsolutions/ui</span>
      <CopyButton {...args} label="Copy command" />
    </div>
  ),
};
