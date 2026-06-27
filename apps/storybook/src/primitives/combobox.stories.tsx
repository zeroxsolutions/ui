import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@zeroxsolutions/ui/combobox';

/**
 * `Combobox` is a filterable select built on Base UI's combobox primitive: a
 * text input that opens a popup list whose options narrow as the user types.
 * Items may be plain strings or objects mapped to display text via
 * `itemToStringLabel`, and the `ComboboxEmpty` slot renders when no option
 * matches the current query.
 */
const meta: Meta<typeof Combobox> = {
  title: 'Primitives/Combobox',
  component: Combobox,
};
export default meta;

type Story = StoryObj<typeof Combobox>;

const fruits = [
  'Apple',
  'Banana',
  'Blueberry',
  'Cherry',
  'Grape',
  'Mango',
  'Orange',
  'Strawberry',
];

/**
 * Demonstrates the simplest setup: an array of plain strings as items, with
 * type-to-filter selection and an empty state when nothing matches.
 */
export const Default: Story = {
  render: () => (
    <Combobox items={fruits}>
      <ComboboxInput placeholder="Pick a fruit…" className="w-64" />
      <ComboboxContent>
        <ComboboxEmpty>No fruit found.</ComboboxEmpty>
        <ComboboxList>
          {fruits.map((fruit) => (
            <ComboboxItem key={fruit} value={fruit}>
              {fruit}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};

type Framework = { value: string; label: string };

const frameworks: Framework[] = [
  { value: 'next', label: 'Next.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
  { value: 'vite', label: 'Vite' },
];

/**
 * Demonstrates object-shaped items whose display text is derived via
 * `itemToStringLabel`, so each option can carry a separate `value` and `label`.
 */
export const Objects: Story = {
  render: () => (
    <Combobox
      items={frameworks}
      itemToStringLabel={(item: Framework) => item.label}
    >
      <ComboboxInput placeholder="Pick a framework…" className="w-64" />
      <ComboboxContent>
        <ComboboxEmpty>No framework found.</ComboboxEmpty>
        <ComboboxList>
          {frameworks.map((framework) => (
            <ComboboxItem key={framework.value} value={framework}>
              {framework.label}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};
