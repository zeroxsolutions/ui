import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { SelectField } from '@zeroxsolutions/ui/select-field';

/**
 * `SelectField` is a compact labelled select for a property inspector, pairing an
 * `InputGroup` label addon with a borderless `Select` trigger so the group owns
 * the single outer chrome. It is controlled — the consumer holds the value — and
 * supports a `mixed` state that clears the selection for multi-target editing.
 */
const meta: Meta<typeof SelectField> = {
  title: 'Components/SelectField',
  component: SelectField,
};
export default meta;

type Story = StoryObj<typeof SelectField>;

const ALIGN = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
];

/** Controlled inspector row — a labelled "Align" select wired to local state. */
export const Inspector: Story = {
  render: () => {
    const [value, setValue] = useState('left');
    return (
      <div className="w-56">
        <SelectField
          label="Align"
          value={value}
          onValueChange={setValue}
          options={ALIGN}
        />
      </div>
    );
  },
};
