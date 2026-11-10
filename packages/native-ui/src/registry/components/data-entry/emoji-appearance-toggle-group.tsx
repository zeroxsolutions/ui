import type { ComponentProps, ReactNode } from 'react';
import { FluentEmoji, type FluentEmojiStyle } from '../../lib/fluent-emoji';
import { cn } from '../../lib/utils';
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group';

/** A glyph every Fluent style has artwork for, so each swatch previews the same emoji. */
const SAMPLE = { glyph: '\u{1F600}', name: 'grinning face' } as const;

type EmojiAppearanceToggleGroupProps = Omit<ComponentProps<typeof ToggleGroup>, 'type' | 'value' | 'onValueChange'> & {
  /** The selected artwork style. */
  value: FluentEmojiStyle;
  /** Called with the newly chosen style; choosing the selected one again reports nothing. */
  onValueChange: (style: FluentEmojiStyle) => void;
};

/**
 * A row of preview swatches for the Fluent emoji artwork style, one `EmojiAppearanceToggleGroupItem` per style
 * offered, as its direct children. Each swatch draws the same sample emoji in its style before its label, so the
 * preview is the selector. Single-choice, announced as a radio group named "Emoji style" unless given an
 * `aria-label`, and a style is always chosen. Outlined, at the toggle group's default spacing, and wrapping onto
 * further rows when narrower than its swatches.
 *
 * An app-level appearance control: the caller owns persisting the choice and applying it app-wide.
 */
function EmojiAppearanceToggleGroup({
  value,
  onValueChange,
  className,
  ...props
}: EmojiAppearanceToggleGroupProps): ReactNode {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      aria-label="Emoji style"
      value={value}
      onValueChange={(picked) => {
        if (picked) onValueChange(picked as FluentEmojiStyle);
      }}
      className={cn('flex-wrap', className)}
      {...props}
    />
  );
}

type EmojiAppearanceToggleGroupItemProps = Omit<ComponentProps<typeof ToggleGroupItem>, 'value' | 'children'> & {
  /** The artwork style this swatch previews and selects. */
  value: FluentEmojiStyle;
  /** The label that names the swatch, a Text. */
  children?: ReactNode;
};

/**
 * One swatch: the sample emoji drawn 24px in `value`'s style, hidden from a screen reader, before the label
 * (`children`, a Text) that names the swatch. The black `mono` artwork is tinted the foreground colour.
 */
function EmojiAppearanceToggleGroupItem({ value, children, ...props }: EmojiAppearanceToggleGroupItemProps): ReactNode {
  return (
    <ToggleGroupItem value={value} {...props}>
      <FluentEmoji glyph={SAMPLE.glyph} name={SAMPLE.name} variant={value} aria-hidden className="size-6" />
      {children}
    </ToggleGroupItem>
  );
}

export { EmojiAppearanceToggleGroup, EmojiAppearanceToggleGroupItem };
export type { EmojiAppearanceToggleGroupItemProps, EmojiAppearanceToggleGroupProps };
