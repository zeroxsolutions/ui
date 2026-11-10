import { useState, type ReactNode } from 'react';

import {
  EmojiAppearanceToggleGroup,
  EmojiAppearanceToggleGroupItem,
} from '@/components/data-entry/emoji-appearance-toggle-group';
import { Text } from '@/components/ui/text';
import type { FluentEmojiStyle } from '@/lib/fluent-emoji';

/** Every Fluent artwork style, previewed and picked from one row. */
function EmojiAppearanceToggleGroupDemo(): ReactNode {
  const [style, setStyle] = useState<FluentEmojiStyle>('3d');

  return (
    <EmojiAppearanceToggleGroup value={style} onValueChange={setStyle}>
      <EmojiAppearanceToggleGroupItem value="3d">
        <Text>3D</Text>
      </EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="flat">
        <Text>Flat</Text>
      </EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="modern">
        <Text>Modern</Text>
      </EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="mono">
        <Text>Mono</Text>
      </EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="anim">
        <Text>Animated</Text>
      </EmojiAppearanceToggleGroupItem>
    </EmojiAppearanceToggleGroup>
  );
}

export { EmojiAppearanceToggleGroupDemo };
