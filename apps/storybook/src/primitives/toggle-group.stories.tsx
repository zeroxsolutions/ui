import type { Meta, StoryObj } from '@storybook/react-vite';
import { BoldIcon, ItalicIcon, UnderlineIcon } from 'lucide-react';

import { ToggleGroup, ToggleGroupItem } from '@zeroxsolutions/ui/toggle-group';

/**
 * `ToggleGroup` is a Base UI set of related two-state toggle buttons, where each
 * `ToggleGroupItem` is a pressable on/off control and the group shares
 * `variant`, `size`, and `spacing` with its items through context. Use it for
 * grouped controls such as a text-formatting toolbar; selected values are
 * tracked as an array (`defaultValue` for uncontrolled usage).
 */
const meta: Meta<typeof ToggleGroup> = {
  title: 'Primitives/ToggleGroup',
  component: ToggleGroup,
};
export default meta;

type Story = StoryObj<typeof ToggleGroup>;

/** Default variant with three formatting toggles and `bold` pressed initially. */
export const Default: Story = {
  render: () => (
    <ToggleGroup defaultValue={['bold']}>
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <BoldIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <ItalicIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline">
        <UnderlineIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

/** `outline` variant with bordered items and `italic` pressed initially. */
export const Outline: Story = {
  render: () => (
    <ToggleGroup variant="outline" defaultValue={['italic']}>
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <BoldIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <ItalicIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline">
        <UnderlineIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};
