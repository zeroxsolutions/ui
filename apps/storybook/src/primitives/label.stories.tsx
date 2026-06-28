import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from '@zeroxsolutions/ui/components/ui/input';
import { Label } from '@zeroxsolutions/ui/components/ui/label';

/**
 * `Label` renders a styled `<label>` element for form controls, linked to an
 * input through the `htmlFor` attribute. It applies small, medium-weight text and
 * dims itself when a paired `peer` control or wrapping `group` is disabled. Use it
 * to caption inputs, checkboxes, and other fields.
 */
const meta: Meta<typeof Label> = {
  title: 'Primitives/Label',
  component: Label,
};
export default meta;

type Story = StoryObj<typeof Label>;

/** Standard usage: a label captioning an email input, associated via `htmlFor`/`id`. */
export const Default: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};
