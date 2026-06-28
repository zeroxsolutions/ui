import type { Meta, StoryObj } from '@storybook/react-vite';
import { BoldIcon } from 'lucide-react';

import { Toggle } from '@zeroxsolutions/ui/components/ui/toggle';

/**
 * `Toggle` is a two-state pressed/unpressed button built on the Base UI Toggle
 * primitive. Use it for a single on/off control, such as a formatting button in
 * a toolbar. It renders icon-only children here, so each instance carries an
 * `aria-label` to stay accessible.
 */
const meta: Meta<typeof Toggle> = {
  title: 'Primitives/Toggle',
  component: Toggle,
};
export default meta;

type Story = StoryObj<typeof Toggle>;

/** Default variant: a transparent toggle with no border, pressed state filled. */
export const Default: Story = {
  render: () => (
    <Toggle aria-label="Toggle bold">
      <BoldIcon />
    </Toggle>
  ),
};

/** Outline variant: a bordered toggle for use against busy or low-contrast surfaces. */
export const Outline: Story = {
  render: () => (
    <Toggle variant="outline" aria-label="Toggle bold">
      <BoldIcon />
    </Toggle>
  ),
};
