/** An address a reader may open from a block: a web or mail address. */
const LINK = /^(?:https?:|mailto:)/i;
/** An address a block may load an image or a media file from. */
const SOURCE = /^https?:/i;

/**
 * `value` trimmed where it is a web or mail address, else undefined: a stored `javascript:` or `data:` address,
 * or one a browser would read with a scheme hidden behind a control character, never reaches an `href`.
 */
export function linkAddress(value: string): string | undefined {
  const trimmed = value.trim();
  return LINK.test(trimmed) ? trimmed : undefined;
}

/** `value` trimmed where it is a web address an image, a video or a sound loads from, else undefined. */
export function sourceAddress(value: string): string | undefined {
  const trimmed = value.trim();
  return SOURCE.test(trimmed) ? trimmed : undefined;
}
