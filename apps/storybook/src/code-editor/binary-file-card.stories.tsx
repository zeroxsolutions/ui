import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download } from 'lucide-react';

import { BinaryFileCard } from '@zeroxsolutions/ui/binary-file-card';
import { Button } from '@zeroxsolutions/ui/button';

/**
 * `BinaryFileCard` is the centered fallback shown for a file that has no inline
 * viewer (binary or unknown type): a type icon derived from the file name, the
 * name itself, then any `children` — typically the file size, a download action,
 * or a "no preview" note, all consumer-owned. It fills the space it is given, so
 * place it inside a sized container.
 */
const meta: Meta<typeof BinaryFileCard> = {
  title: 'Code Editor/BinaryFileCard',
  component: BinaryFileCard,
};
export default meta;

type Story = StoryObj<typeof BinaryFileCard>;

/** Default fallback: a binary file with a size note and a download button passed as children. */
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
