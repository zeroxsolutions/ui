import type { Meta, StoryObj } from '@storybook/react-vite';

import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from '@chiselart/ui/native-select';

const meta: Meta<typeof NativeSelect> = {
  title: 'Primitives/NativeSelect',
  component: NativeSelect,
};
export default meta;

type Story = StoryObj<typeof NativeSelect>;

export const Default: Story = {
  render: () => (
    <NativeSelect defaultValue="sketch" className="w-56">
      <NativeSelectOption value="sketch">Sketch</NativeSelectOption>
      <NativeSelectOption value="figma">Figma</NativeSelectOption>
      <NativeSelectOption value="chisel">Chisel</NativeSelectOption>
    </NativeSelect>
  ),
};

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
