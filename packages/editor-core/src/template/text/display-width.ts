import { eastAsianWidthType } from 'get-east-asian-width';

// One segmenter for the module: `segment` keeps no state between calls, so overlapping requests share it.
const GRAPHEMES = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * How many display units `value` takes: one per grapheme, two where a grapheme's first code point is East
 * Asian Wide or Fullwidth. An Ambiguous character counts one, because a mail client outside an East Asian font
 * renders it narrow, and the budget has to hold there too.
 */
export function displayWidth(value: string): number {
  let width = 0;
  for (const { segment } of GRAPHEMES.segment(value)) {
    const type = eastAsianWidthType(segment.codePointAt(0) ?? 0);
    width += type === 'wide' || type === 'fullwidth' ? 2 : 1;
  }
  return width;
}
