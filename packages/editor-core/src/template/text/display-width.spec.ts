// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { displayWidth } from './display-width.js';

describe('displayWidth', () => {
  it.each([
    ['a Latin letter counts one', 'Verify', 6],
    ['a Vietnamese accented letter is one grapheme, and an Ambiguous one counts one', 'X\u00e1c nh\u1eadn', 8],
    ['a Simplified Chinese character counts two', '\u786e\u8ba4\u60a8\u7684\u90ae\u7bb1', 12],
    ['a Hangul syllable counts two', '\uc774\uba54\uc77c', 6],
    ['a fullwidth Latin letter counts two', '\uff21', 2],
    ['a halfwidth katakana counts one', '\uff71', 1],
    ['a combining accent joins the letter before it', 'e\u0301', 1],
    ['a joined emoji family is one wide grapheme', '\u{1F468}\u200d\u{1F469}\u200d\u{1F467}', 2],
  ])('%s', (_case, value, width) => {
    expect(displayWidth(value)).toBe(width);
  });
});
