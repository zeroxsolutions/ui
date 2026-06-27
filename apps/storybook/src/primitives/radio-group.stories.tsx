import type { Meta, StoryObj } from '@storybook/react-vite';

import { Label } from '@zeroxsolutions/ui/label';
import { RadioGroup, RadioGroupItem } from '@zeroxsolutions/ui/radio-group';

const meta: Meta<typeof RadioGroup> = {
  title: 'Primitives/RadioGroup',
  component: RadioGroup,
};
export default meta;

type Story = StoryObj<typeof RadioGroup>;

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
