import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from '@zeroxsolutions/ui/components/ui/native-select';

/**
 * `NativeSelect` wraps the platform `<select>` element with consistent border,
 * focus-ring, and chevron styling while preserving native open/close behavior
 * and keyboard support. Compose it with `NativeSelectOption` and
 * `NativeSelectOptGroup`, and use the `size` prop (`sm` / `default`) to align it
 * with surrounding form controls. Prefer it over a custom listbox when native
 * mobile pickers and zero-JavaScript option rendering matter.
 */
const meta: Meta<typeof NativeSelect> = {
  title: 'Primitives/NativeSelect',
  component: NativeSelect,
};
export default meta;

type Story = StoryObj<typeof NativeSelect>;

/** Flat list of options at the default size with an initial selection. */
export const Default: Story = {
  render: () => (
    <NativeSelect defaultValue="sketch" className="w-56">
      <NativeSelectOption value="sketch">Sketch</NativeSelectOption>
      <NativeSelectOption value="figma">Figma</NativeSelectOption>
      <NativeSelectOption value="other">Other</NativeSelectOption>
    </NativeSelect>
  ),
};

/** Options organized under `NativeSelectOptGroup` labels at the small (`sm`) size. */
export const Grouped: Story = {
  render: () => (
    <NativeSelect defaultValue="opus" size="sm" className="w-56">
      <NativeSelectOptGroup label="Anthropic">
        <NativeSelectOption value="opus">Opus</NativeSelectOption>
        <NativeSelectOption value="sonnet">Sonnet</NativeSelectOption>
        <NativeSelectOption value="haiku">Haiku</NativeSelectOption>
      </NativeSelectOptGroup>
      <NativeSelectOptGroup label="OpenAI">
        <NativeSelectOption value="gpt">GPT</NativeSelectOption>
      </NativeSelectOptGroup>
    </NativeSelect>
  ),
};
