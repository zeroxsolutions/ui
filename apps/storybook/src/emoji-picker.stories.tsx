import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { FluentEmoji } from '@zeroxsolutions/fluent-emoji';
import { EmojiPicker } from '@zeroxsolutions/ui/components/emoji-picker';

/**
 * `EmojiPicker` is a searchable, categorized emoji grid with a category jump-nav
 * and an optional frequent row. The grid is windowed, so only the rows in (and
 * near) the viewport mount when the catalog opens. It reports the chosen glyph
 * through `onSelect`; the frequent row is consumer-supplied (`frequent`) — the
 * picker keeps no storage of its own.
 */
const meta: Meta<typeof EmojiPicker> = {
  title: 'Components/EmojiPicker',
  component: EmojiPicker,
};
export default meta;

type Story = StoryObj<typeof EmojiPicker>;

/** The bare picker wired to local state, with the picked glyph previewed above. */
export const Default: Story = {
  render: () => {
    const [picked, setPicked] = useState<string | null>(null);
    return (
      <div className="flex flex-col items-center gap-3">
        <FluentEmoji
          glyph={picked ?? '🙂'}
          className="size-full object-contain p-[12%]"
        />
        <div className="w-[332px] rounded-lg bg-popover p-2 text-popover-foreground shadow-md ring-1 ring-foreground/10">
          <EmojiPicker onSelect={setPicked} />
        </div>
      </div>
    );
  },
};

/**
 * A seeded frequent row: `frequent` supplies the recently-used glyphs and
 * `frequentLabel` renames its heading from the default `Frequently used`.
 */
export const CustomFrequentLabel: Story = {
  render: () => {
    const [picked, setPicked] = useState<string | null>(null);
    return (
      <div className="flex flex-col items-center gap-3">
        <FluentEmoji
          glyph={picked ?? '🙂'}
          className="size-full object-contain p-[12%]"
        />
        <div className="w-[332px] rounded-lg bg-popover p-2 text-popover-foreground shadow-md ring-1 ring-foreground/10">
          <EmojiPicker
            onSelect={setPicked}
            frequent={['🍕', '🎉', '🚀', '❤️']}
            frequentLabel="Recently used"
          />
        </div>
      </div>
    );
  },
};
