import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { NumberField } from '@zeroxsolutions/ui/number-field';

/**
 * `NumberField` is a compact, controlled numeric input for a property
 * inspector: an input group with an optional leading label and trailing unit
 * addons whose value accepts arithmetic expressions and clamps to `min`/`max`.
 * The consumer owns the number and supplies any placeholder copy.
 */
const meta: Meta<typeof NumberField> = {
  title: 'Components/NumberField',
  component: NumberField,
};
export default meta;

type Story = StoryObj<typeof NumberField>;

/**
 * The canonical inspector layout: a pair of width/height fields, each with a
 * `px` unit suffix and a `min` of 0.
 */
export const Inspector: Story = {
  render: () => {
    const [w, setW] = useState(240);
    const [h, setH] = useState(96);
    return (
      <div className="flex w-72 gap-2">
        <NumberField
          label="W"
          value={w}
          onValueChange={setW}
          suffix="px"
          min={0}
        />
        <NumberField
          label="H"
          value={h}
          onValueChange={setH}
          suffix="px"
          min={0}
        />
      </div>
    );
  },
};

/**
 * The `mixed` state for a multi-selection whose targets hold differing values:
 * the field blanks out and shows the `placeholder` until the user types a value,
 * which then applies to every selected target.
 */
export const Mixed: Story = {
  render: () => {
    const [value, setValue] = useState(0);
    return (
      <div className="w-40">
        {/* Multi-selection with differing values — the consumer owns the copy. */}
        <NumberField
          label="R"
          value={value}
          onValueChange={setValue}
          mixed
          placeholder="Mixed"
        />
      </div>
    );
  },
};
