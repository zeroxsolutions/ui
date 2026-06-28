import type { Meta, StoryObj } from '@storybook/react-vite';
import { Circle, Square, Triangle } from 'lucide-react';
import { useState } from 'react';

import { SplitButton } from '@zeroxsolutions/ui/components/split-button';

/**
 * `SplitButton` pairs a primary action button with a separate, always-visible
 * chevron that opens a menu to switch which option is current. Clicking the
 * primary region runs `onPrimary` for the active option, while selecting a menu
 * item fires `onValueChange`. It is generic over the option `value` and carries
 * no knowledge of the options' domain — pass `options`, the current `value`, and
 * the two handlers.
 */
const meta: Meta<typeof SplitButton> = {
  title: 'Components/SplitButton',
  component: SplitButton,
};
export default meta;

type Story = StoryObj<typeof SplitButton>;

const SHAPES = [
  { value: 'rect', label: 'Rectangle', icon: Square, shortcut: 'R' },
  { value: 'ellipse', label: 'Ellipse', icon: Circle, shortcut: 'O' },
  { value: 'triangle', label: 'Triangle', icon: Triangle, shortcut: 'T' },
] as const;

/**
 * A controlled shape-tool picker: the primary button acts on the current shape
 * while the chevron menu switches between Rectangle, Ellipse, and Triangle, each
 * with its own keyboard shortcut.
 */
export const ShapeTool: Story = {
  render: () => {
    const [value, setValue] =
      useState<(typeof SHAPES)[number]['value']>('rect');
    return (
      <div className="rounded-md border p-1">
        <SplitButton
          options={[...SHAPES]}
          value={value}
          onPrimary={() => {}}
          onValueChange={setValue}
          dropdownLabel="Shape tools"
        />
      </div>
    );
  },
};
