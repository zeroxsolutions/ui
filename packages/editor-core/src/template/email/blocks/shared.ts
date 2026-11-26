import { z } from 'zod';
import { leadingToken } from '../../markup/href.js';
import { SPACES, WIDTH_MIN, type LayoutAlign, type LayoutSpace } from '../../layout/index.js';
import { parseInlineMarkup } from '../../markup/inline-markup.js';

/** The longest text one block holds, a button's label and href, and the most items a list holds. */
export const BLOCK_TEXT_MAX_LENGTH = 5000;
export const BUTTON_LABEL_MAX_LENGTH = 200;
export const BUTTON_HREF_MAX_LENGTH = 2000;
export const LIST_MAX_ITEMS = 20;

/** One block's text on a write: present, and bounded. */
export const blockText = z.string().min(1).max(BLOCK_TEXT_MAX_LENGTH);

/**
 * A text block's text on a write: `blockText` that also parses as inline markup, so a stray `**` is refused
 * where it is saved rather than drawn as a literal. The bound counts the stored string, markers included.
 */
export const inlineText = blockText.refine((text) => parseInlineMarkup(text).ok, {
  message: 'malformed inline markup',
});

/** The wire's alignment names, kept from before the layout model; the editor maps `start` and `end` onto them. */
export const ALIGNS = ['left', 'center', 'right'] as const;
export type Align = (typeof ALIGNS)[number];
export { SPACES };
export type Space = LayoutSpace;

export const align = z.enum(ALIGNS).optional();
export const spaceAfter = z.enum(SPACES).optional();
export const spaceBefore = z.enum(SPACES).optional();

const EMAIL_ALIGNS = { start: 'left', center: 'center', end: 'right' } as const satisfies Record<LayoutAlign, Align>;
const LAYOUT_ALIGNS = { left: 'start', center: 'center', right: 'end' } as const satisfies Record<Align, LayoutAlign>;

/** A layout alignment as the wire names it. */
export function emailAlignOf(align: LayoutAlign): Align {
  return EMAIL_ALIGNS[align];
}

/** A wire alignment as the layout model names it. */
export function layoutAlignOf(align: Align): LayoutAlign {
  return LAYOUT_ALIGNS[align];
}

/** `schema.parse(raw)`, or `fallback` where `raw` is not that shape. */
export function readOr<T>(schema: z.ZodType<T>, raw: unknown, fallback: T): T {
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : fallback;
}

/**
 * An address on a write, as `validate` reads it: one line that opens with a literal scheme of `start`, or with a
 * whole variable token, whose type `validate` checks.
 */
export function address(start: RegExp, max: number): z.ZodType<string> {
  return z
    .string()
    .min(1)
    .max(max)
    .refine((value) => !/[\r\n]/.test(value) && (start.test(value.trim()) || leadingToken(value) !== undefined), {
      message: 'an address a client opens',
    });
}

/** A link a reader's client opens: a page or a mail. */
export const LINK_START = /^(?:https?:\/\/|mailto:)/i;
/** An image a client loads over a secure connection. */
export const IMAGE_START = /^https:\/\//i;

/**
 * The width a block's content is drawn at in the default card: 600px less its 1px border and 16px padding at each
 * side. An image drawn wider pushes Outlook on Windows, which reads no `max-width`, past the card's edge.
 */
export const CONTENT_WIDTH = 566;

/** The card's width inside its 1px border, which a `wide` section reaches. */
export const CARD_INNER_WIDTH = 598;

/** The gap at the end of every lane but the last, which `.zx-lane` pads. */
export const LANE_GUTTER = 8;

/** Each space token's length in px, before or after a block. */
export const SPACE_PX = { none: 0, small: 6, medium: 10, large: 20 } as const satisfies Record<Space, number>;

/**
 * An image's stored width: a fraction of the width it is drawn in, from `WIDTH_MIN` up to but not including 1, or a
 * legacy whole pixel width from 1 to `CONTENT_WIDTH`, which an email written before fractions stored. A stored 1
 * is one pixel, as it always was; the whole width is written as no width.
 */
export const imageWidth = z.union([z.number().min(WIDTH_MIN).lt(1), z.number().int().min(1).max(CONTENT_WIDTH)]);

/** Whether a stored image width is a legacy whole pixel width rather than a fraction. */
export function isLegacyPixelWidth(width: number): boolean {
  return Number.isInteger(width) && width >= 1;
}
