import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link2 } from 'lucide-react';

import { Button } from '@chiselart/ui/button';
import { FieldRow } from '@chiselart/ui/field-row';
import { Input } from '@chiselart/ui/input';

const meta: Meta<typeof FieldRow> = {
  title: 'Layouts/FieldRow',
  component: FieldRow,
};
export default meta;

type Story = StoryObj<typeof FieldRow>;

export const Default: Story = {
  render: () => (
    <div className="w-72 space-y-1">
      <FieldRow
        action={
          <Button variant="ghost" size="icon" aria-label="Link aspect ratio">
            <Link2 />
          </Button>
        }
      >
        <Input placeholder="W" />
        <Input placeholder="H" />
      </FieldRow>
      {/* No action → a same-width spacer keeps these inputs flush with the row
          above (both trailing slots are a default icon-button footprint). */}
      <FieldRow>
        <Input placeholder="X" />
        <Input placeholder="Y" />
      </FieldRow>
    </div>
  ),
};
