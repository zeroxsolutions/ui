import { z } from 'zod';
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

export const ALIGNS = ['left', 'center', 'right'] as const;
export const SPACES = ['small', 'medium', 'large'] as const;
export type Align = (typeof ALIGNS)[number];
export type Space = (typeof SPACES)[number];

export const align = z.enum(ALIGNS).optional();
export const spaceAfter = z.enum(SPACES).optional();

/** `schema.parse(raw)`, or `fallback` where `raw` is not that shape. */
export function readOr<T>(schema: z.ZodType<T>, raw: unknown, fallback: T): T {
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : fallback;
}
