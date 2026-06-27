import type { Meta, StoryObj } from '@storybook/react-vite';

import { MonoChip } from '@zeroxsolutions/ui/mono-chip';

/**
 * `MonoChip` renders a compact monospace pill for short code-ish values such as
 * an identifier, a token count, or a hex color. Pair a width-capping
 * `className` (e.g. `truncate`) with a `title` so a clipped chip still reveals
 * its full value on hover.
 */
const meta: Meta<typeof MonoChip> = {
  title: 'Components/MonoChip',
  component: MonoChip,
};
export default meta;

type Story = StoryObj<typeof MonoChip>;

/**
 * Three chips side by side: a hex value, a token count, and a width-capped
 * identifier that truncates while keeping its full value in the `title`
 * tooltip.
 */
export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <MonoChip>#0099ff</MonoChip>
      <MonoChip>1,024 tok</MonoChip>
      <MonoChip
        title="a-very-long-identifier-0001"
        className="max-w-24 truncate"
      >
        a-very-long-identifier-0001
      </MonoChip>
    </div>
  ),
};
