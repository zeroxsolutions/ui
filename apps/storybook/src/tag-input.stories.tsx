import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { TagInput } from '@zeroxsolutions/ui/tag-input';

/**
 * `TagInput` is a controlled tag editor that renders existing tags as removable
 * chips above a text input, committing a new tag on Enter, comma, or blur and
 * dropping the last tag on Backspace in an empty input. The consumer owns the
 * tag array through `value` / `onValueChange` and supplies any placeholder copy.
 */
const meta: Meta<typeof TagInput> = {
  title: 'Components/TagInput',
  component: TagInput,
};
export default meta;

type Story = StoryObj<typeof TagInput>;

/**
 * Controlled usage seeded with two tags, wiring `value` / `onValueChange` to
 * local state so new entries persist and existing chips can be removed.
 */
export const Default: Story = {
  render: () => {
    const [tags, setTags] = useState(['design', 'ui']);
    return (
      <div className="w-72">
        <TagInput
          value={tags}
          onValueChange={setTags}
          placeholder="Add a tag…"
        />
      </div>
    );
  },
};
