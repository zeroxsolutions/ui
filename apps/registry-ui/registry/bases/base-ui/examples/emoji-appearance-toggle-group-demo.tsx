import type { FluentEmojiStyle } from '@zeroxsolutions/fluent-emoji';
import { useState, type ReactNode } from 'react';

import {
  EmojiAppearanceToggleGroup,
  EmojiAppearanceToggleGroupItem,
} from '@/registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group';

/** Every Fluent artwork style, previewed and picked from one row. */
function EmojiAppearanceToggleGroupDemo(): ReactNode {
  const [style, setStyle] = useState<FluentEmojiStyle>('3d');

  return (
    <EmojiAppearanceToggleGroup value={style} onValueChange={setStyle}>
      <EmojiAppearanceToggleGroupItem value="3d">3D</EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="flat">Flat</EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="modern">Modern</EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="mono">Mono</EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="anim">Animated</EmojiAppearanceToggleGroupItem>
    </EmojiAppearanceToggleGroup>
  );
}

export { EmojiAppearanceToggleGroupDemo };
