import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { EmojiAppearance } from '@chiselart/ui/emoji-appearance';
import type { FluentEmojiStyle } from '@chiselart/fluent-emoji';

const meta: Meta<typeof EmojiAppearance> = {
  title: 'Components/EmojiAppearance',
  component: EmojiAppearance,
};
export default meta;

type Story = StoryObj<typeof EmojiAppearance>;

export const Default: Story = {
  render: () => {
    const [style, setStyle] = useState<FluentEmojiStyle>('3d');
    return (
      <div className="flex flex-col items-start gap-3">
        <EmojiAppearance value={style} onValueChange={setStyle} />
        <p className="text-sm text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{style}</span>
        </p>
      </div>
    );
  },
};
