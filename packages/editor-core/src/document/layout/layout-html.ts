/**
 * The layout model in HTML, both ways, with the DOM alone: each value as a `data-*` attribute, read back with the
 * inline styles and pixel widths a pasted or older document carries mapped onto tokens, or dropped.
 */
import {
  ALIGNS,
  COLOR_TOKENS,
  HUES,
  PARAGRAPH_SIZES,
  readLayout,
  SPACES,
  TEXT_ALIGNS,
  widthFromPixels,
  WIDTH_MIN,
  type ColorToken,
  type Layout,
  type ParagraphSize,
  type TextAlign,
} from '../../template/layout/index.js';

/** A block's layout and a text block's alignment and size, as one node's attributes hold them. */
export type LayoutAttributes = Layout & { textAlign?: TextAlign; size?: ParagraphSize };

function oneOf<T extends string>(values: readonly T[], value: unknown): T | undefined {
  return typeof value === 'string' && (values as readonly string[]).includes(value) ? (value as T) : undefined;
}

function isWidth(value: unknown): value is Layout['width'] {
  return value === 'full' || (typeof value === 'number' && value >= WIDTH_MIN && value <= 1);
}

/**
 * The `data-*` attributes `attrs` is written as: `data-align`, `data-width`, `data-space-before`,
 * `data-space-after`, `data-layout-responsive` (JSON), `data-text-align` and `data-size`. A value that is absent
 * or outside its set writes nothing.
 */
export function layoutDataAttributes(attrs: LayoutAttributes): Record<string, string> {
  const written: Record<string, string> = {};
  const align = oneOf(ALIGNS, attrs.align);
  if (align !== undefined) written['data-align'] = align;
  if (isWidth(attrs.width)) written['data-width'] = String(attrs.width);
  const spaceBefore = oneOf(SPACES, attrs.spaceBefore);
  if (spaceBefore !== undefined) written['data-space-before'] = spaceBefore;
  const spaceAfter = oneOf(SPACES, attrs.spaceAfter);
  if (spaceAfter !== undefined) written['data-space-after'] = spaceAfter;
  const responsive = readLayout({ responsive: attrs.responsive }).responsive;
  if (responsive !== undefined) written['data-layout-responsive'] = JSON.stringify(responsive);
  const textAlign = oneOf(TEXT_ALIGNS, attrs.textAlign);
  if (textAlign !== undefined) written['data-text-align'] = textAlign;
  const size = oneOf(PARAGRAPH_SIZES, attrs.size);
  if (size !== undefined) written['data-size'] = size;
  return written;
}

/** A CSS `text-align` as a token: the physical `left` and `right` read as `start` and `end`. */
const CSS_TEXT_ALIGNS: Readonly<Record<string, TextAlign>> = {
  left: 'start',
  start: 'start',
  center: 'center',
  right: 'end',
  end: 'end',
  justify: 'justify',
};

function parsedJson(text: string | null): unknown {
  if (text === null) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * The layout `element` carries: its `data-*` attributes as `layoutDataAttributes` writes them, a
 * `style="text-align"` where it has no `data-text-align`, and, given `legacyPixelBase`, an `<img width>` in pixels
 * read as a fraction of that base. Every value outside its set, and every other pixel length, is dropped.
 */
export function layoutFromElement(element: HTMLElement, legacyPixelBase?: number): LayoutAttributes {
  const width = element.getAttribute('data-width');
  const layout = readLayout({
    align: element.getAttribute('data-align') ?? undefined,
    width: width === 'full' ? 'full' : width === null ? undefined : Number(width),
    spaceBefore: element.getAttribute('data-space-before') ?? undefined,
    spaceAfter: element.getAttribute('data-space-after') ?? undefined,
    responsive: parsedJson(element.getAttribute('data-layout-responsive')),
  });
  const pixels = Number(element.getAttribute('width'));
  if (layout.width === undefined && element.tagName === 'IMG' && legacyPixelBase !== undefined && pixels >= 1) {
    layout.width = widthFromPixels(pixels, legacyPixelBase);
  }
  const textAlign =
    oneOf(TEXT_ALIGNS, element.getAttribute('data-text-align')) ?? CSS_TEXT_ALIGNS[element.style.textAlign];
  const size = oneOf(PARAGRAPH_SIZES, element.getAttribute('data-size'));
  return {
    ...layout,
    ...(textAlign === undefined ? {} : { textAlign }),
    ...(size === undefined ? {} : { size }),
  };
}

/**
 * The colour token `element` names for its text (`color`) or behind it (`background`): its `data-color` or
 * `data-bg` token, or a CSS named colour equal to a hue's name. A hex, an `rgb()` or any other colour is null.
 */
export function colorTokenFromElement(element: HTMLElement, property: 'color' | 'background'): ColorToken | null {
  const token = oneOf(COLOR_TOKENS, element.getAttribute(property === 'color' ? 'data-color' : 'data-bg'));
  if (token !== undefined) return token;
  const css = property === 'color' ? element.style.color : element.style.backgroundColor;
  return oneOf(HUES, css.trim().toLowerCase()) ?? null;
}
