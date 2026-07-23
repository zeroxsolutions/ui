import { emojiToUnicode } from './emoji-to-unicode';

/**
 * The rendering styles we ship, each in its own `assets/<style>/` subfolder:
 * `'3d'` (webp), `'flat'`, `'modern'` (colorful 2D), `'mono'` (monochrome — the
 * middle three as svg), and `'anim'` (animated webp). Animated artwork is the
 * heaviest set (~hundreds of KB/glyph), so prefer serving it from a CDN base for
 * production builds — see the package README.
 */
export type FluentEmojiStyle = '3d' | 'flat' | 'modern' | 'mono' | 'anim';

/** Per style: the subfolder it lives in and its file extension. */
const STYLE_ASSET: Record<FluentEmojiStyle, { dir: string; ext: string }> = {
  '3d': { dir: '3d', ext: 'webp' },
  flat: { dir: 'flat', ext: 'svg' },
  modern: { dir: 'modern', ext: 'svg' },
  mono: { dir: 'mono', ext: 'svg' },
  anim: { dir: 'anim', ext: 'webp' },
};

const DEFAULT_STYLE: FluentEmojiStyle = '3d';

// Default base: the package's own `assets/` dir, resolved relative to this
// module. It works wherever the package's files are served as-is (Node, a Vite
// dev server, or an app that serves `dist/assets`). For a production web build,
// point it at where the artwork is actually served — copy
// `@zeroxsolutions/fluent-emoji/dist/assets` into your public dir, or use your CDN —
// via setFluentEmojiBase (or a per-call `base`).
//
// Vite leaves this literal (no asset extension → not transformed/inlined), so it
// is plain URL math at runtime, not a bundled asset.
const DEFAULT_BASE = new URL('./assets', import.meta.url).href;

let configuredBase: string | undefined;
let configuredStyle: FluentEmojiStyle | undefined;
let configuredStyleBases: Partial<Record<FluentEmojiStyle, string>> = {};

/**
 * Point the resolver at the base URL where the Fluent artwork is served (e.g.
 * `/fluent-emoji`, or your CDN). The resolver appends `/<style>/<codepoint>.<ext>`
 * to it. Pass `undefined` to fall back to the package's bundled `assets/`
 * location. A per-call `base` and any per-style base ({@link setFluentEmojiStyleBase})
 * still win.
 */
export function setFluentEmojiBase(base: string | undefined): void {
  configuredBase = base;
}

/**
 * Serve ONE style from its own base URL, independent of the global
 * {@link setFluentEmojiBase}. This is how the animated `anim` style is wired to a
 * CDN: it is intentionally **not** shipped in the npm tarball (too large), so
 * point it at where you host `assets/anim/` while the bundled static styles keep
 * resolving from the package/global base. The resolver still appends
 * `/<style>/<codepoint>.<ext>`, so upload the `anim/` folder under this base.
 * Pass `undefined` to clear the override. A per-call `base` still wins over this.
 *
 * @example
 * setFluentEmojiStyleBase('anim', 'https://cdn.example.com/fluent-emoji');
 * // <FluentEmoji glyph="🎉" variant="anim" /> →
 * //   https://cdn.example.com/fluent-emoji/anim/1f389.webp
 */
export function setFluentEmojiStyleBase(
  style: FluentEmojiStyle,
  base: string | undefined,
): void {
  const next = { ...configuredStyleBases };
  if (base === undefined) delete next[style];
  else next[style] = base;
  configuredStyleBases = next;
}

/**
 * Set the default rendering style (see {@link FluentEmojiStyle}) for every
 * resolve that doesn't pass a per-call `style`. Pass `undefined` to fall back to
 * `'3d'`.
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
 * `<base>/<style>/<codepoint>.<ext>` — where `style` is the per-call option,
 * {@link setFluentEmojiStyle}, or `'3d'`; `base` is the per-call option, that
 * style's base from {@link setFluentEmojiStyleBase}, the global
 * {@link setFluentEmojiBase}, or the package's bundled `assets/` location; and
 * `ext` is `webp` for `3d`/`anim`, `svg` for the rest. Returns `undefined` for an
 * empty glyph. A missing file at the resolved URL is the caller's concern —
 * render the native glyph as a fallback (see {@link FluentEmoji}).
 */
export function fluentEmojiUrl(
  glyph: string,
  options?: FluentEmojiUrlOptions,
): string | undefined {
  const code = emojiToUnicode(glyph);
  if (!code) return undefined;
  const style = options?.style ?? configuredStyle ?? DEFAULT_STYLE;
  const base =
    options?.base ?? configuredStyleBases[style] ?? configuredBase ?? DEFAULT_BASE;
  const { dir, ext } = STYLE_ASSET[style];
  return `${base.replace(/\/+$/, '')}/${dir}/${code}.${ext}`;
}
