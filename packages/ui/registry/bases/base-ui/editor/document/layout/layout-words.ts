import type {
  ColorToken,
  LayoutAlign,
  LayoutSpace,
  ParagraphSize,
  SectionWidth,
  TextAlign,
  VAlign,
} from '@zeroxsolutions/editor-core/template/layout/index';

/**
 * Every word the layout controls draw, in both editors: a block's alignment, width and space, a text's alignment,
 * colour and paragraph style, a section's, a columns block's and a table's. A host passes its own catalogue's words
 * through a feature's `messages`, and the email editor through `ProfileEditorMessages.layout`.
 */
export interface LayoutWords {
  /** The name of a block's floating toolbar. */
  readonly toolbar: string;
  /** The name of the group that places a block across its container. */
  readonly align: string;
  /** Each place, named for a left-to-right reader; a host translating for another direction names its own. */
  readonly aligns: Readonly<Record<LayoutAlign, string>>;
  /** The toggle that bleeds a block to its container's edges. */
  readonly fullWidth: string;
  /** Takes a block's width back to its own. */
  readonly resetWidth: string;
  /** The name of the width handle on each side of a block. */
  readonly resizeEdges: Readonly<Record<'start' | 'end', string>>;
  /** What a width handle reads out: the block's width as a whole percent of its container. */
  resize(percent: number): string;
  readonly spaceBefore: string;
  readonly spaceAfter: string;
  readonly spaces: Readonly<Record<LayoutSpace, string>>;
  /** The name of the group that aligns a text's lines. */
  readonly textAlign: string;
  readonly textAligns: Readonly<Record<TextAlign, string>>;
  readonly textColor: string;
  readonly textBackground: string;
  /** The colour set's names; `default` takes a colour away. */
  readonly colors: Readonly<Record<ColorToken, string>>;
  /** The paragraph styles beside the plain paragraph, as Turn into lists them. */
  readonly paragraphSizes: Readonly<Record<ParagraphSize, string>>;
  /** The section's slash item, and what its description says it is. */
  readonly section: string;
  readonly sectionDescription: string;
  readonly sectionBackground: string;
  /** A section's background that draws the page behind it. */
  readonly noBackground: string;
  readonly sectionPadding: string;
  readonly sectionWidth: string;
  readonly sectionWidths: Readonly<Record<SectionWidth, string>>;
  readonly addColumn: string;
  readonly removeColumn: string;
  /** The name of the group that sets where a columns block's lanes sit against the tallest. */
  readonly verticalAlign: string;
  readonly valigns: Readonly<Record<VAlign, string>>;
  /** The name of the handle between lane `left` and the one after it, counted from 1. */
  columnDivider(left: number): string;
  /** What a lane divider reads out: each lane's share as a whole percent, in order. */
  columnShares(percents: readonly number[]): string;
  /** The name of the handle on the trailing border of a table's column `column`, counted from 1. */
  tableColumnBorder(column: number): string;
}

export const DEFAULT_LAYOUT_WORDS: LayoutWords = {
  toolbar: 'Block layout',
  align: 'Alignment',
  aligns: { start: 'Align left', center: 'Align center', end: 'Align right' },
  fullWidth: 'Full width',
  resetWidth: 'Reset width',
  resizeEdges: { start: 'Resize from the left edge', end: 'Resize from the right edge' },
  resize: (percent) => `Resize, ${percent}%`,
  spaceBefore: 'Space before',
  spaceAfter: 'Space after',
  spaces: { none: 'None', small: 'Small', medium: 'Medium', large: 'Large' },
  textAlign: 'Text alignment',
  textAligns: { start: 'Align left', center: 'Align center', end: 'Align right', justify: 'Justify' },
  textColor: 'Text color',
  textBackground: 'Background',
  colors: {
    default: 'Default',
    muted: 'Muted',
    primary: 'Primary',
    accent: 'Accent',
    red: 'Red',
    orange: 'Orange',
    amber: 'Amber',
    green: 'Green',
    teal: 'Teal',
    blue: 'Blue',
    violet: 'Violet',
    pink: 'Pink',
  },
  paragraphSizes: { lead: 'Lead', small: 'Small text' },
  section: 'Section',
  sectionDescription: 'Blocks set together on a background',
  sectionBackground: 'Background',
  noBackground: 'None',
  sectionPadding: 'Padding',
  sectionWidth: 'Width',
  sectionWidths: { content: 'Content', wide: 'Wide', full: 'Full' },
  addColumn: 'Add column',
  removeColumn: 'Remove column',
  verticalAlign: 'Vertical alignment',
  valigns: { top: 'Top', center: 'Middle', bottom: 'Bottom' },
  columnDivider: (left) => `Divider between columns ${left} and ${left + 1}`,
  columnShares: (percents) => percents.map((percent) => `${percent}%`).join(', '),
  tableColumnBorder: (column) => `Border after column ${column}`,
};

/**
 * `words` over the English, so a host passing some of them keeps the rest; a getter is read each time it is called,
 * so a host's language change shows on the next draw.
 */
export function layoutWordsOf(words?: Partial<LayoutWords> | (() => LayoutWords)): LayoutWords {
  if (typeof words === 'function') return words();
  return words ? { ...DEFAULT_LAYOUT_WORDS, ...words } : DEFAULT_LAYOUT_WORDS;
}
