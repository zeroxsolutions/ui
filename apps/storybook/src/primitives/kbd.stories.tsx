import type { Meta, StoryObj } from '@storybook/react-vite';

import { Kbd, KbdGroup } from '@zeroxsolutions/ui/kbd';

/**
 * `Kbd` renders a `<kbd>` element styled as a keyboard key cap for displaying
 * shortcuts and hotkeys inline with text. Compose several `Kbd` elements inside
 * `KbdGroup` to present a multi-key combination as one inline cluster.
 */
const meta: Meta<typeof Kbd> = {
  title: 'Primitives/Kbd',
  component: Kbd,
};
export default meta;

type Story = StoryObj<typeof Kbd>;

/** A single key cap rendering one shortcut glyph. */
export const Default: Story = {
  render: () => <Kbd>⌘</Kbd>,
};

/** Two key caps grouped with `KbdGroup` to express a key combination. */
export const Combo: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
};
