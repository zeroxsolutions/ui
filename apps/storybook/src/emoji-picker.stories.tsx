import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { EmojiPicker } from '@chiselart/ui/emoji-picker';

const meta: Meta<typeof EmojiPicker> = {
  title: 'Components/EmojiPicker',
  component: EmojiPicker,
};
export default meta;

type Story = StoryObj<typeof EmojiPicker>;

export const Default: Story = {
  render: () => {
    const [picked, setPicked] = useState<string | null>(null);
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 items-center text-3xl">{picked ?? '—'}</div>
        <div className="w-[332px] rounded-lg bg-popover p-2 text-popover-foreground shadow-md ring-1 ring-foreground/10">
          <EmojiPicker onSelect={setPicked} />
        </div>
      </div>
    );
  },
};
