import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import type { FluentEmojiStyle } from '@zeroxsolutions/fluent-emoji';
import { EmojiAppearance } from '@zeroxsolutions/ui/emoji-appearance';

/**
 * `EmojiAppearance` is a single-select row of preview swatches for the emoji
 * artwork style — 3D / Flat / Modern / Mono / Animated — each swatch rendering
 * the same sample glyph in its own style so the preview itself is the selector.
 * It is a controlled, app-level appearance preference (`value` /
 * `onValueChange`); the consumer owns persisting and applying the choice.
 */
const meta: Meta<typeof EmojiAppearance> = {
  title: 'Components/EmojiAppearance',
  component: EmojiAppearance,
};
export default meta;

type Story = StoryObj<typeof EmojiAppearance>;

/**
 * Controlled usage: the chosen style is held in local state and echoed below the
 * swatches, starting from `3d`.
 */
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
