import { emojiToUnicode } from './codepoint';

/**
 * The rendering styles we ship, each in its own `assets/<style>/` subfolder:
 * `'3d'` (webp), `'flat'`, `'modern'` (colorful 2D), and `'mono'` (monochrome) —
 * the last three as svg. (The animated `anim` style is not bundled; it is too
 * large to self-host — see the package README.)
 */
export type FluentEmojiStyle = '3d' | 'flat' | 'modern' | 'mono';

/** Per style: the subfolder it lives in and its file extension. */
const STYLE_ASSET: Record<FluentEmojiStyle, { dir: string; ext: string }> = {
  '3d': { dir: '3d', ext: 'webp' },
  flat: { dir: 'flat', ext: 'svg' },
  modern: { dir: 'modern', ext: 'svg' },
  mono: { dir: 'mono', ext: 'svg' },
};

const DEFAULT_STYLE: FluentEmojiStyle = '3d';

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
let configuredStyle: FluentEmojiStyle | undefined;

/**
 * Point the resolver at the base URL where the Fluent artwork is served (e.g.
 * `/fluent-emoji`, or your CDN). The resolver appends `/<style>/<codepoint>.<ext>`
 * to it. Pass `undefined` to fall back to the package's bundled `assets/`
 * location. A per-call `base` still wins.
 */
export function setFluentEmojiBase(base: string | undefined): void {
  configuredBase = base;
}

/**
 * Set the default rendering style (`'3d'` or `'flat'`) for every resolve that
 * doesn't pass a per-call `style`. Pass `undefined` to fall back to `'3d'`.
 */
export function setFluentEmojiStyle(style: FluentEmojiStyle | undefined): void {
  configuredStyle = style;
}

export interface FluentEmojiUrlOptions {
  /**
   * Serve from this base URL (`<base>/<style>/<codepoint>.<ext>`) — overrides any
   * base set via {@link setFluentEmojiBase} and the bundled default.
   */
  base?: string;
  /**
   * Render style — overrides {@link setFluentEmojiStyle} and the `'3d'` default.
   */
  style?: FluentEmojiStyle;
}

/**
 * Resolve an emoji glyph to its Fluent artwork URL:
 * `<base>/<style>/<codepoint>.<ext>` — where `base` is the per-call option, the
 * value from {@link setFluentEmojiBase}, or the package's bundled `assets/`
 * location; `style` is the per-call option, {@link setFluentEmojiStyle}, or
 * `'3d'`; and `ext` is `webp` for 3D, `svg` for Flat. Returns `undefined` for an
 * empty glyph. A missing file at the resolved URL is the caller's concern —
 * render the native glyph as a fallback (see {@link FluentEmoji}).
 */
export function fluentEmojiUrl(
  glyph: string,
  options?: FluentEmojiUrlOptions,
): string | undefined {
  const code = emojiToUnicode(glyph);
  if (!code) return undefined;
  const base = options?.base ?? configuredBase ?? DEFAULT_BASE;
  const style = options?.style ?? configuredStyle ?? DEFAULT_STYLE;
  const { dir, ext } = STYLE_ASSET[style];
  return `${base.replace(/\/+$/, '')}/${dir}/${code}.${ext}`;
}
