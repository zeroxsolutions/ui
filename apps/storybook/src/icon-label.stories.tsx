import type { Meta, StoryObj } from '@storybook/react-vite';
import { RotateCw } from 'lucide-react';

import { IconLabel } from '@chiselart/ui/icon-label';

const meta: Meta<typeof IconLabel> = {
  title: 'Components/IconLabel',
  component: IconLabel,
};
export default meta;

type Story = StoryObj<typeof IconLabel>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconLabel icon={RotateCw} tooltip="Rotation" />
      <span className="text-sm text-muted-foreground">hover the icon</span>
    </div>
  ),
};
