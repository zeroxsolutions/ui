import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link2 } from 'lucide-react';

import { Button } from '@zeroxsolutions/ui/components/ui/button';
import { FieldRow } from '@zeroxsolutions/ui/components/layouts/field-row';
import { Input } from '@zeroxsolutions/ui/components/ui/input';

/**
 * `FieldRow` pairs an inner `FieldGrid` (two columns by default) with a fixed
 * trailing action slot. The slot is always reserved at a single icon-button
 * width — whether it holds an action or none — so every row's inputs share the
 * same right edge and a property panel reads as one aligned grid.
 */
const meta: Meta<typeof FieldRow> = {
  title: 'Layouts/FieldRow',
  component: FieldRow,
};
export default meta;

type Story = StoryObj<typeof FieldRow>;

/**
 * Two stacked rows — the first with a trailing aspect-lock action, the second
 * with none — showing that the reserved slot keeps both rows' inputs flush to
 * the same right edge even when no action is present.
 */
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
