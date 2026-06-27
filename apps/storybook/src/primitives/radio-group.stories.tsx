import type { Meta, StoryObj } from '@storybook/react-vite';

import { Label } from '@zeroxsolutions/ui/label';
import { RadioGroup, RadioGroupItem } from '@zeroxsolutions/ui/radio-group';

/**
 * `RadioGroup` is a Base UI single-selection control that manages a set of
 * mutually exclusive `RadioGroupItem` options. Set the initial choice with
 * `defaultValue` (or control it via `value`), and wrap each item in a `Label`
 * so its text is clickable. Use it when exactly one option from a short list
 * must be chosen.
 */
const meta: Meta<typeof RadioGroup> = {
  title: 'Primitives/RadioGroup',
  component: RadioGroup,
};
export default meta;

type Story = StoryObj<typeof RadioGroup>;

/** Vertical group of three options with "comfortable" pre-selected via `defaultValue`. */
export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable" className="w-64">
      <Label className="flex items-center gap-2">
        <RadioGroupItem value="default" />
        Default
      </Label>
      <Label className="flex items-center gap-2">
        <RadioGroupItem value="comfortable" />
        Comfortable
      </Label>
      <Label className="flex items-center gap-2">
        <RadioGroupItem value="compact" />
        Compact
      </Label>
    </RadioGroup>
  ),
};
