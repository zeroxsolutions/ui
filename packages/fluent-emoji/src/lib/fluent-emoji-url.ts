import { emojiToUnicode } from './emoji-to-unicode';
import { FLUENT_EMOJI_MANIFEST_KEYS, FLUENT_EMOJI_MANIFEST_MISSING } from './emoji-manifest';

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

const MANIFEST_KEYS = new Set(FLUENT_EMOJI_MANIFEST_KEYS);
// Built lazily per style on first use, from the (short) committed exception list,
// rather than eagerly for all five: most calls resolve one or two styles.
const missingByStyle = new Map<FluentEmojiStyle, Set<string>>();

/** Whether `code` has a committed `assets/<style>/` file, per the generated manifest. */
function hasArtwork(code: string, style: FluentEmojiStyle): boolean {
  if (!MANIFEST_KEYS.has(code)) return false;
  let missing = missingByStyle.get(style);
  if (!missing) {
    missing = new Set(FLUENT_EMOJI_MANIFEST_MISSING[style]);
    missingByStyle.set(style, missing);
  }
  return !missing.has(code);
}

// Default base: the package's own `assets/` dir, resolved relative to this
// module. It works wherever the package's files are served as-is (Node, a Vite
// dev server, or an app that serves `dist/assets`). For a production web build,
// point it at where the artwork is actually served — copy
// `@zeroxsolutions/fluent-emoji/dist/assets` into your public dir, or use your CDN —
// via setFluentEmojiBase (or a per-call `base`).
//
// Built from the module URL's text, not `new URL('./assets', import.meta.url)`:
// Turbopack resolves that form to a file when an app builds, follows it through
// a variable too, and fails the build on a directory ("Module not found: Can't
// resolve './assets'").
const DEFAULT_BASE = import.meta.url.replace(/[^/]*$/, 'assets');

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
export function setFluentEmojiStyleBase(style: FluentEmojiStyle, base: string | undefined): void {
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
   * base set via {@link setFluentEmojiBase} and the bundled default. It only
   * relocates where the artwork is fetched from: the generated manifest still
   * describes this package's own `assets/`, so a glyph the manifest has no file
   * for resolves to `undefined` regardless of `base` (see {@link fluentEmojiUrl}).
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
 * empty glyph, and also for a glyph the generated manifest (`emoji-manifest.ts`,
 * built from `assets/`) has no file for in that style; a custom `base` does not
 * change this, since the manifest is about what this package ships, not where it
 * is served from. Render the native glyph as a fallback for either case (see
 * {@link FluentEmoji}).
 */
export function fluentEmojiUrl(glyph: string, options?: FluentEmojiUrlOptions): string | undefined {
  const code = emojiToUnicode(glyph);
  if (!code) return undefined;
  const style = options?.style ?? configuredStyle ?? DEFAULT_STYLE;
  if (!hasArtwork(code, style)) return undefined;
  const base = options?.base ?? configuredStyleBases[style] ?? configuredBase ?? DEFAULT_BASE;
  const { dir, ext } = STYLE_ASSET[style];
  return `${base.replace(/\/+$/, '')}/${dir}/${code}.${ext}`;
}
