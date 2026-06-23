/**
 * Map an emoji glyph to its codepoint-sequence key — every code point as
 * lowercase hex, joined by `-` (e.g. `🤯` → `1f92f`, `🇻🇳` → `1f1fb-1f1f3`).
 * Spreading the string iterates by code point, so surrogate pairs collapse to a
 * single entry. This is the filename key under which the artwork is stored, so
 * the same function must produce both the saved asset name and the lookup key.
 */
export function emojiToUnicode(glyph: string): string {
  return [...glyph]
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join('-');
}
