import type { Meta, StoryObj } from '@storybook/react-vite';

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
      <FieldRow action={<Button variant="ghost" size="icon">🔒</Button>}>
        <Input placeholder="W" />
        <Input placeholder="H" />
      </FieldRow>
      {/* No action → an aligned spacer keeps the inputs flush with the row above. */}
      <FieldRow>
        <Input placeholder="X" />
        <Input placeholder="Y" />
      </FieldRow>
    </div>
  ),
};
