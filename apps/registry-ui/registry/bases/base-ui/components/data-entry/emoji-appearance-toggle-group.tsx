import { FluentEmoji, type FluentEmojiStyle } from '@zeroxsolutions/fluent-emoji';
import type { ComponentProps, ReactNode } from 'react';

import { ToggleGroup, ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';

// A glyph present in every Fluent style - each swatch previews it so the user
// sees the artwork rather than reading a style name.
const SAMPLE = { glyph: '😀', name: 'grinning face' } as const;

interface EmojiAppearanceToggleGroupProps extends Omit<
  ComponentProps<typeof ToggleGroup>,
  'value' | 'defaultValue' | 'onValueChange' | 'multiple'
> {
  /** The selected artwork style. */
  value: FluentEmojiStyle;
  /** Notified with the newly chosen style; choosing the selected one again reports nothing. */
  onValueChange: (style: FluentEmojiStyle) => void;
}

/**
 * A row of preview swatches for the Fluent emoji artwork **style**, one
 * `EmojiAppearanceToggleGroupItem` per style the consumer offers. Each swatch
 * renders the same sample emoji in its style (an `anim` swatch plays its frames)
 * before its label, so the preview is the selector. Single-select, and a style is
 * always chosen. Outlined and spaced apart unless `variant` or `spacing` say
 * otherwise.
 *
 * This is an **app-level appearance control**, not part of the emoji glyph picker:
 * the artwork style is a global preference. It's controlled (`value` /
 * `onValueChange`); the consumer owns persistence and applying the choice app-wide
 * (`setFluentEmojiStyle` from `@zeroxsolutions/fluent-emoji`).
 */
function EmojiAppearanceToggleGroup({ value, onValueChange, ...props }: EmojiAppearanceToggleGroupProps): ReactNode {
  return (
    <ToggleGroup
      // Single-select: Base UI's value is an array; bind the lone style and
      // ignore a deselect so a style is always chosen.
      data-slot="emoji-appearance-toggle-group"
      value={[value]}
      onValueChange={(next) => {
        const picked = next[0] as FluentEmojiStyle | undefined;
        if (picked) onValueChange(picked);
      }}
      variant="outline"
      spacing={2}
      aria-label="Emoji style"
      {...props}
    />
  );
}

interface EmojiAppearanceToggleGroupItemProps extends Omit<ComponentProps<typeof ToggleGroupItem>, 'value'> {
  /** The artwork style this swatch previews and selects. */
  value: FluentEmojiStyle;
}

/**
 * One swatch: the sample emoji drawn in `value`'s style before the consumer's
 * label (`children`), which names the swatch; the preview itself is decorative,
 * drawn at the size the toggle gives an icon.
 */
function EmojiAppearanceToggleGroupItem({ value, children, ...props }: EmojiAppearanceToggleGroupItemProps): ReactNode {
  return (
    <ToggleGroupItem data-slot="emoji-appearance-toggle-group-item" value={value} {...props}>
      <FluentEmoji
        glyph={SAMPLE.glyph}
        name={SAMPLE.name}
        variant={value}
        aria-hidden
        className="size-4 object-contain"
      />
      {children}
    </ToggleGroupItem>
  );
}

export { EmojiAppearanceToggleGroup, EmojiAppearanceToggleGroupItem };
export type { EmojiAppearanceToggleGroupProps, EmojiAppearanceToggleGroupItemProps };
