import { emojiToUnicode } from './codepoint';

// Default base: the package's own `assets/` dir, resolved relative to this
// module. It works wherever the package's files are served as-is (Node, a Vite
// dev server, or an app that serves `dist/assets`). For a production web build,
// point it at where the artwork is actually served — copy
// `@chiselart/fluent-emoji/dist/assets` into your public dir, or use your CDN —
// via setFluentEmojiBase (or a per-call `base`).
//
// Vite leaves this literal (no asset extension → not transformed/inlined), so it
// is plain URL math at runtime, not a bundled asset.
const DEFAULT_BASE = new URL('./assets', import.meta.url).href;

let configuredBase: string | undefined;

/**
 * Point the resolver at the base URL where the Fluent artwork is served (e.g.
 * `/fluent-emoji`, or your CDN). Pass `undefined` to fall back to the package's
 * bundled `assets/` location. A per-call `base` still wins.
 */
export function setFluentEmojiBase(base: string | undefined): void {
  configuredBase = base;
}

export interface FluentEmojiUrlOptions {
  /**
   * Serve from this base URL (`<base>/<codepoint>.webp`) — overrides any base
   * set via {@link setFluentEmojiBase} and the bundled default.
   */
  base?: string;
}

/**
 * Resolve an emoji glyph to its Fluent 3D `.webp` URL: `<base>/<codepoint>.webp`,
 * where `base` is the per-call option, the value from {@link setFluentEmojiBase},
 * or the package's bundled `assets/` location. Returns `undefined` for an empty
 * glyph. A missing file at the resolved URL is the caller's concern — render the
 * native glyph as a fallback (see {@link FluentEmoji}).
 */
export function fluentEmojiUrl(
  glyph: string,
  options?: FluentEmojiUrlOptions,
): string | undefined {
  const code = emojiToUnicode(glyph);
  if (!code) return undefined;
  const base = options?.base ?? configuredBase ?? DEFAULT_BASE;
  return `${base.replace(/\/+$/, '')}/${code}.webp`;
}
