import * as React from 'react';
import { fluentEmojiUrl, type FluentEmojiStyle } from './fluent-emoji-url';
import { useAmbientFluentEmojiStyle } from './fluent-emoji-style-provider';

export interface FluentEmojiProps extends Omit<React.ComponentProps<'img'>, 'src' | 'alt'> {
  /** The emoji glyph to render. */
  glyph: string;
  /** Accessible name for the artwork; defaults to the glyph itself. */
  name?: string;
  /** Serve from this base URL instead of the bundled asset (see {@link fluentEmojiUrl}).
   *  Only relocates the artwork; a glyph the manifest has no file for still falls
   *  back to the native glyph regardless of `base`. */
  base?: string;
  /** Render style — `'3d'` (default), `'flat'`, `'modern'`, `'mono'`, or
   *  `'anim'` (animated); see {@link FluentEmojiStyle}. */
  variant?: FluentEmojiStyle;
}

/**
 * Microsoft **Fluent** rendering of an emoji `glyph`, resolved by codepoint to a
 * bundled asset (`'3d'` webp by default, or `'flat'` svg via `variant`) — no
 * third-party CDN. On a missing asset or a load error it falls back to the
 * native glyph so nothing renders blank. Pass `base` (or call
 * `setFluentEmojiBase`) to serve the artwork from a CDN instead.
 *
 * The animated `'anim'` artwork gives way to the still `'3d'` picture of the glyph for a reader who asked
 * for reduced motion.
 *
 * Style precedence: an explicit `variant` wins; otherwise the ambient style from
 * a {@link FluentEmojiStyleProvider} (re-renders on change); otherwise the
 * resolver default (`setFluentEmojiStyle` / `'3d'`).
 */
export function FluentEmoji({ glyph, name, base, variant, className, ...props }: FluentEmojiProps) {
  const ambient = useAmbientFluentEmojiStyle();
  const style = variant ?? ambient;
  const src = fluentEmojiUrl(glyph, base || style ? { base, style } : undefined);
  const [failed, setFailed] = React.useState(false);
  // Reset the error latch when the resolved artwork changes, so a recycled
  // instance (same key, new glyph) re-attempts the image instead of staying on
  // the previous fallback.
  React.useEffect(() => setFailed(false), [src]);

  if (failed || !src) {
    return (
      <span role="img" aria-label={name ?? glyph} className={className}>
        {glyph}
      </span>
    );
  }
  const image = (
    <img
      src={src}
      alt={name ?? glyph}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={className}
      onError={() => setFailed(true)}
      {...props}
    />
  );
  const still = style === 'anim' ? fluentEmojiUrl(glyph, { base, style: '3d' }) : undefined;
  if (!still) return image;
  return (
    // `contents` leaves the img to the layout the caller placed it in, as if the picture were not there.
    <picture style={{ display: 'contents' }}>
      <source media="(prefers-reduced-motion: reduce)" srcSet={still} />
      {image}
    </picture>
  );
}
