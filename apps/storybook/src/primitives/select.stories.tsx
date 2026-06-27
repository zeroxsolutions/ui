import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@zeroxsolutions/ui/select';

/**
 * `Select` is a listbox-style dropdown for choosing a single value from a set of
 * options. `SelectTrigger`/`SelectValue` render the closed control and current
 * selection, while `SelectContent` holds the popup `SelectItem`s, which can be
 * organized with `SelectGroup`, `SelectLabel`, and `SelectSeparator`. Use it for
 * single-choice form fields where the chosen value is shown in the trigger.
 */
const meta: Meta<typeof Select> = {
  title: 'Primitives/Select',
  component: Select,
};
export default meta;

type Story = StoryObj<typeof Select>;

/** A flat single-choice list with a placeholder shown until an item is picked. */
export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="blueberry">Blueberry</SelectItem>
        <SelectItem value="grapes">Grapes</SelectItem>
      </SelectContent>
    </Select>
  ),
};

/** Options partitioned into labeled `SelectGroup`s divided by a `SelectSeparator`. */
export const Grouped: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          <SelectItem value="est">Eastern (EST)</SelectItem>
          <SelectItem value="pst">Pacific (PST)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Europe</SelectLabel>
          <SelectItem value="gmt">Greenwich (GMT)</SelectItem>
          <SelectItem value="cet">Central European (CET)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};
