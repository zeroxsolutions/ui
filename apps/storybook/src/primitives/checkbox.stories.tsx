import type { Meta, StoryObj } from '@storybook/react-vite';

import { Checkbox } from '@zeroxsolutions/ui/checkbox';
import { Label } from '@zeroxsolutions/ui/label';

/**
 * `Checkbox` is a Base UI checkbox styled as a small square control that shows a
 * check icon when selected and supports checked, unchecked, and disabled states.
 * Pair it with a `Label` linked via matching `id` / `htmlFor` for an accessible,
 * clickable caption. Use it for binary on/off choices such as toggling a single
 * option or accepting terms.
 */
const meta: Meta<typeof Checkbox> = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
};
export default meta;

type Story = StoryObj<typeof Checkbox>;

/** Default-checked checkbox wired to an adjacent `Label` via matching `id` / `htmlFor`. */
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" defaultChecked />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

/** The three core states stacked together: unchecked, checked, and disabled. */
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="unchecked" />
        <Label htmlFor="unchecked">Unchecked</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="checked" defaultChecked />
        <Label htmlFor="checked">Checked</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="disabled" disabled />
        <Label htmlFor="disabled">Disabled</Label>
      </div>
    </div>
  ),
};
