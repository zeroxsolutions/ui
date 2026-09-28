import { ToggleGroup, ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';
import { FluentEmoji, type FluentEmojiStyle } from '@zeroxsolutions/fluent-emoji';
import * as React from 'react';

/** The selectable Fluent artwork styles, in display order. */
const STYLE_OPTIONS: { id: FluentEmojiStyle; label: string }[] = [
  { id: '3d', label: '3D' },
  { id: 'flat', label: 'Flat' },
  { id: 'modern', label: 'Modern' },
  { id: 'mono', label: 'Mono' },
  { id: 'anim', label: 'Animated' },
];

// A glyph present in every Fluent style - each swatch previews it so the user
// sees the artwork rather than reading a style name.
const SAMPLE = { glyph: '😀', name: 'grinning face' } as const;

interface EmojiAppearanceToggleGroupProps extends Omit<
  React.ComponentProps<typeof ToggleGroup>,
  'value' | 'onValueChange'
> {
  /** The selected artwork style. */
  value: FluentEmojiStyle;
  /** Notified with the newly chosen style. */
  onValueChange: (style: FluentEmojiStyle) => void;
}

/**
 * A row of preview swatches for the Fluent emoji artwork **style** - 3D / Flat /
 * Modern / Mono / Animated - each swatch rendering the same sample emoji in its
 * style (the Animated swatch plays its frames), so the preview *is* the selector
 * (you see each appearance rather than reading a label). Single-select.
 *
 * This is an **app-level appearance control**, not part of the emoji glyph picker:
 * the artwork style is a global preference. It's controlled (`value` /
 * `onValueChange`); the consumer owns persistence and applying the choice app-wide
 * (`setFluentEmojiStyle` from `@zeroxsolutions/fluent-emoji`).
 */
function EmojiAppearanceToggleGroup({ value, onValueChange, ...props }: EmojiAppearanceToggleGroupProps) {
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
    >
      {STYLE_OPTIONS.map((o) => (
        <ToggleGroupItem
          key={o.id}
          value={o.id}
          aria-label={`${o.label} style`}
          // Base UI Toggle marks the pressed item with `aria-pressed`/`data-pressed`
          // (not Radix's `data-state=on`); ring the selected swatch off that.
          className="aria-pressed:ring-ring h-auto flex-col gap-1 px-3 py-2 aria-pressed:ring-2"
        >
          <FluentEmoji glyph={SAMPLE.glyph} name={SAMPLE.name} variant={o.id} className="size-8 object-contain" />
          <span className="text-muted-foreground text-xs">{o.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export { EmojiAppearanceToggleGroup };
export type { EmojiAppearanceToggleGroupProps };
