// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { fitsOneSmsSegment, measureSms } from './measure.js';

describe('measureSms', () => {
  it('counts all-ASCII text as GSM-7, one unit a character', () => {
    expect(measureSms('Your code is 123456')).toEqual({ encoding: 'gsm7', units: 19 });
  });

  it.each(['^', '{', '}', '\\', '[', ']', '~', '|'])(
    'counts the extension character %s as two GSM-7 units',
    (character) => {
      expect(measureSms(`a${character}`)).toEqual({ encoding: 'gsm7', units: 3 });
    },
  );

  it('counts text holding a Vietnamese diacritic as UCS-2, one unit per UTF-16 code unit', () => {
    // "Ma xac nhan: 123456" with its diacritics: 19 code units, every one a single unit.
    expect(measureSms('M\u00e3 x\u00e1c nh\u1eadn: 123456')).toEqual({ encoding: 'ucs2', units: 19 });
  });

  it('counts a character outside the basic plane as the two UTF-16 units it is sent as', () => {
    expect(measureSms('\u{1f600}')).toEqual({ encoding: 'ucs2', units: 2 });
  });
});

describe('fitsOneSmsSegment', () => {
  it.each([
    ['160 ASCII characters', 'a'.repeat(160), true],
    ['161 ASCII characters', 'a'.repeat(161), false],
    ['158 characters and one extension character', `${'a'.repeat(158)}~`, true],
    ['159 characters and one extension character', `${'a'.repeat(159)}~`, false],
    ['70 UCS-2 characters', '\u00e1'.repeat(70), true],
    ['71 UCS-2 characters', '\u00e1'.repeat(71), false],
  ])('answers %s with %s', (_case, text, fits) => {
    expect(fitsOneSmsSegment(measureSms(text))).toBe(fits);
  });
});
