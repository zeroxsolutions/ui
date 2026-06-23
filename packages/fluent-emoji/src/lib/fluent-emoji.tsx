import * as React from 'react';
import { fluentEmojiUrl } from './resolve';

export interface FluentEmojiProps
  extends Omit<React.ComponentProps<'img'>, 'src' | 'alt'> {
  /** The emoji glyph to render. */
  glyph: string;
  /** Accessible name for the artwork; defaults to the glyph itself. */
  name?: string;
  /** Serve from this base URL instead of the bundled asset (see resolve). */
  base?: string;
}

/**
 * Microsoft **Fluent 3D** rendering of an emoji `glyph`, resolved by codepoint
 * to a bundled `.webp` — no third-party CDN. On a missing asset or a load error
 * it falls back to the native glyph so nothing renders blank. Pass `base` (or
 * call `setFluentEmojiBase`) to serve the artwork from a CDN instead.
 */
export function FluentEmoji({
  glyph,
  name,
  base,
  className,
  ...props
}: FluentEmojiProps) {
  const src = fluentEmojiUrl(glyph, base ? { base } : undefined);
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
  return (
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
}
