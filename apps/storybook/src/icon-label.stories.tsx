import type { Meta, StoryObj } from '@storybook/react-vite';
import { RotateCw } from 'lucide-react';

import { IconLabel } from '@zeroxsolutions/ui/icon-label';

/**
 * `IconLabel` is an icon-only form label that reveals its meaning in a hover
 * tooltip, for dense panels that mark fields with a glyph instead of verbose
 * text. It renders a tooltip trigger wrapping the passed icon, so the stories
 * hover the icon to surface the label.
 */
const meta: Meta<typeof IconLabel> = {
  title: 'Components/IconLabel',
  component: IconLabel,
};
export default meta;

type Story = StoryObj<typeof IconLabel>;

/** Single icon label beside a hint; hover the icon to reveal its tooltip text. */
export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconLabel icon={RotateCw} tooltip="Rotation" />
      <span className="text-sm text-muted-foreground">hover the icon</span>
    </div>
  ),
};
