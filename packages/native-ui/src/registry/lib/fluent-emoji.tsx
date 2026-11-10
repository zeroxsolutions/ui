import { Image } from 'expo-image';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '../ui/text';
import { useChartTheme } from './chart-theme';
import { cn } from './utils';

/**
 * The Fluent artwork styles: `'3d'` and `'anim'` (animated) as webp, `'flat'`, `'modern'` (colourful 2D) and
 * `'mono'` (black) as svg.
 */
type FluentEmojiStyle = '3d' | 'flat' | 'modern' | 'mono' | 'anim';

/** Where the house CDN serves every style's artwork, under `<style>/<codepoint>.<ext>`. */
const FLUENT_EMOJI_BASE = 'https://fluent-emoji.zeroxsolutions.com';

const STYLE_EXTENSION: Record<FluentEmojiStyle, string> = {
  '3d': 'webp',
  flat: 'svg',
  modern: 'svg',
  mono: 'svg',
  anim: 'webp',
};

interface FluentEmojiUrlOptions {
  /** Serve from this base URL instead of {@link FLUENT_EMOJI_BASE}; a trailing slash is dropped. */
  base?: string;
  /** Defaults to `'3d'`. */
  style?: FluentEmojiStyle;
}

/**
 * The Fluent artwork URL of an emoji glyph, `<base>/<style>/<codepoint>.<ext>`, the codepoint being every code
 * point of the glyph as lowercase hex joined by `-`, variation selectors and joiners included. `undefined` for
 * an empty glyph. It does not know which glyphs have artwork, so a glyph with none gets a URL the CDN does not
 * serve, and {@link FluentEmoji} draws the glyph instead.
 */
function fluentEmojiUrl(glyph: string, { base = FLUENT_EMOJI_BASE, style = '3d' }: FluentEmojiUrlOptions = {}) {
  const code = [...glyph]
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join('-');
  if (!code) return undefined;
  return `${base.replace(/\/+$/, '')}/${style}/${code}.${STYLE_EXTENSION[style]}`;
}

type FluentEmojiProps = Omit<ComponentProps<typeof View>, 'children'> & {
  /** The emoji glyph to draw. */
  glyph: string;
  /** The artwork's name for a screen reader; defaults to the glyph itself. */
  name?: string;
  /** Serve from this base URL instead of {@link FLUENT_EMOJI_BASE}. */
  base?: string;
  /** The artwork style; defaults to `'3d'`. */
  variant?: FluentEmojiStyle;
};

/**
 * An emoji glyph in Microsoft's Fluent artwork, drawn by expo-image from the CDN in a 24px box unless
 * `className` sizes it, and announced as an image named `name`, or not at all when `aria-hidden`, as beside a
 * label that names it. Where the artwork fails to load, the glyph is drawn as text instead, so the box is never
 * blank. The black `mono` artwork is tinted the foreground colour.
 */
function FluentEmoji({ glyph, name, base, variant, className, ...props }: FluentEmojiProps): ReactNode {
  const { themeColor } = useChartTheme();
  // iOS names a pressable from the labels of the views inside it, hidden ones included, so a hidden emoji
  // carries no label to add to its parent's name.
  const announced = props['aria-hidden'] !== true;
  const source = fluentEmojiUrl(glyph, { base, style: variant });
  const [failed, setFailed] = useState(false);
  // An instance handed another glyph tries its artwork again rather than keeping the last one's fallback.
  useEffect(() => setFailed(false), [source]);

  return (
    <View
      accessible={announced}
      role={announced ? 'img' : undefined}
      aria-label={announced ? (name ?? glyph) : undefined}
      className={cn('size-6 items-center justify-center', className)}
      {...props}
    >
      {failed || source === undefined ? (
        <Text aria-hidden>{glyph}</Text>
      ) : (
        <Image
          source={source}
          accessible={false}
          contentFit="contain"
          tintColor={variant === 'mono' ? themeColor('--foreground') : undefined}
          style={{ width: '100%', height: '100%' }}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

export { FLUENT_EMOJI_BASE, FluentEmoji, fluentEmojiUrl };
export type { FluentEmojiProps, FluentEmojiStyle, FluentEmojiUrlOptions };
