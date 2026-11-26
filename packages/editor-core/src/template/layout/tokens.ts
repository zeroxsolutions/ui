import { SPACES, type LayoutSpace } from './layout.js';

/** How a text block's lines sit; the email offers no `justify`. */
export const TEXT_ALIGNS = ['start', 'center', 'end', 'justify'] as const;
export type TextAlign = (typeof TEXT_ALIGNS)[number];

/** The block types that take a text alignment; a quote's or a list item's text is aligned through its paragraphs. */
export const TEXT_ALIGN_NODES = ['paragraph', 'heading'] as const;

/** The named hues; each theme maps a hue to a light and a dark value. */
export const HUES = ['red', 'orange', 'amber', 'green', 'teal', 'blue', 'violet', 'pink'] as const;
export type Hue = (typeof HUES)[number];

/** The closed set a text or background colour is picked from; `default` is the absence of a colour. */
export const COLOR_TOKENS = ['default', 'muted', 'primary', 'accent', ...HUES] as const;
export type ColorToken = (typeof COLOR_TOKENS)[number];

/** A section's background: `none` draws the page behind it. */
export const SECTION_BACKGROUNDS = ['none', 'muted', 'primary', 'accent', ...HUES] as const;
export type SectionBackground = (typeof SECTION_BACKGROUNDS)[number];

/** A section's inner padding takes the space tokens. */
export const SECTION_PADDINGS = SPACES;

/** How far a section reaches: the content column, the card's or page's inner edges, or the whole viewport. */
export const SECTION_WIDTHS = ['content', 'wide', 'full'] as const;
export type SectionWidth = (typeof SECTION_WIDTHS)[number];

/** A section's own layout, beside the `spaceBefore` and `spaceAfter` every block takes. */
export interface SectionLayout {
  background?: SectionBackground;
  padding?: LayoutSpace;
  width?: SectionWidth;
}

/** Where a column's lanes sit against the tallest. */
export const VALIGNS = ['top', 'center', 'bottom'] as const;
export type VAlign = (typeof VALIGNS)[number];

/** The paragraph styles beside the normal paragraph. */
export const PARAGRAPH_SIZES = ['lead', 'small'] as const;
export type ParagraphSize = (typeof PARAGRAPH_SIZES)[number];
