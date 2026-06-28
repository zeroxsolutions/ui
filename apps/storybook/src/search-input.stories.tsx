import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { SearchInput } from '@zeroxsolutions/ui/components/search-input';

/**
 * `SearchInput` is the `input-group` composition (a leading magnifier icon plus
 * a `type="search"` control) packaged as one component, so call-sites never
 * hand-roll the icon alignment. It spreads the remaining props onto the inner
 * `<input>`, while `className` sizes the surrounding group — use it anywhere a
 * standalone search field is needed (toolbars, filter bars, command panels).
 */
const meta: Meta<typeof SearchInput> = {
  title: 'Components/SearchInput',
  component: SearchInput,
};
export default meta;

type Story = StoryObj<typeof SearchInput>;

/**
 * The baseline field: an uncontrolled input with a placeholder. The magnifier
 * addon is supplied by the component, so only input props are passed.
 */
export const Default: Story = {
  args: {
    placeholder: 'Search…',
  },
};

/**
 * A controlled example: `value` and `onChange` are wired to `useState`, and the
 * current query is echoed below to show the typed value flowing through React
 * state.
 */
export const Controlled: Story = {
  render: () => {
    const [query, setQuery] = useState('annual report');
    return (
      <div className="flex flex-col gap-2">
        <SearchInput
          placeholder="Search documents…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Searching for: {query || '(empty)'}
        </p>
      </div>
    );
  },
};

/**
 * Width sizing via `className`: the group is constrained to a fixed width while
 * the input stretches to fill it, demonstrating that layout is controlled on
 * the wrapper rather than the control.
 */
export const SizedWidth: Story = {
  args: {
    placeholder: 'Filter results…',
    className: 'w-72',
  },
};
