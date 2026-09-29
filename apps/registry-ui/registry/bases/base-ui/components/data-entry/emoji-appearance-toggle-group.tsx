import { FluentEmoji, type FluentEmojiStyle } from '@zeroxsolutions/fluent-emoji';
import type { ComponentProps, ReactNode } from 'react';

import { ToggleGroup, ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';
import { cn } from '@/registry/bases/base-ui/lib/utils';

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
 * renders the same sample emoji in its style (an `anim` swatch plays its frames),
 * so the preview is the selector. Single-select, and a style is always chosen.
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
      spacing={6}
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
 * One swatch: the sample emoji drawn in `value`'s style over the consumer's
 * label (`children`), which names the swatch; the preview itself is decorative.
 */
function EmojiAppearanceToggleGroupItem({
  value,
  className,
  children,
  ...props
}: EmojiAppearanceToggleGroupItemProps): ReactNode {
  return (
    <ToggleGroupItem
      data-slot="emoji-appearance-toggle-group-item"
      value={value}
      // Base UI Toggle marks the pressed item with `aria-pressed`/`data-pressed`
      // (not Radix's `data-state=on`); ring the selected swatch off that.
      className={cn('aria-pressed:ring-ring h-auto flex-col gap-1 px-3 py-2 aria-pressed:ring-2', className)}
      {...props}
    >
      <FluentEmoji
        glyph={SAMPLE.glyph}
        name={SAMPLE.name}
        variant={value}
        aria-hidden
        className="size-8 object-contain"
      />
      <span className="text-muted-foreground text-xs">{children}</span>
    </ToggleGroupItem>
  );
}

export { EmojiAppearanceToggleGroup, EmojiAppearanceToggleGroupItem };
export type { EmojiAppearanceToggleGroupProps, EmojiAppearanceToggleGroupItemProps };
