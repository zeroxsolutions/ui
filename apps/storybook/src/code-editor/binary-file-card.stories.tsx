import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download } from 'lucide-react';

import { BinaryFileCard } from '@chiselart/ui/binary-file-card';
import { Button } from '@chiselart/ui/button';

const meta: Meta<typeof BinaryFileCard> = {
  title: 'Code Editor/BinaryFileCard',
  component: BinaryFileCard,
};
export default meta;

type Story = StoryObj<typeof BinaryFileCard>;

export const Default: Story = {
  render: () => (
    <div className="h-72 w-96 rounded-lg border">
      <BinaryFileCard name="dataset.bin">
        <span className="text-xs text-muted-foreground">
          4.2 MB · No preview available
        </span>
        <Button variant="outline" size="sm">
          <Download data-icon="inline-start" />
          Download
        </Button>
      </BinaryFileCard>
    </div>
  ),
};
