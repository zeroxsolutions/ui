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

/**
 * An image's stored width: a fraction of the width it is drawn in, `WIDTH_MIN` to 1, or a legacy whole pixel width
 * from 1 to `CONTENT_WIDTH`. A stored 1 reads as the whole width, never as one pixel.
 */
export const imageWidth = z.union([z.number().min(WIDTH_MIN).max(1), z.number().int().min(1).max(CONTENT_WIDTH)]);
