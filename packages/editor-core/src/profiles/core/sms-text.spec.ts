import { describe, expect, it } from 'vitest';
import { fromSmsText, measureSmsBody, toSmsText } from './sms-text.js';

describe('SMS text', () => {
  it('round-trips a body with tokens and a line break', () => {
    const body = 'Hi {{name}},\nyour code is {{code}}.';
    expect(toSmsText(fromSmsText(body))).toBe(body);
  });

  it('reads a token as a variable node', () => {
    expect(fromSmsText('{{a}}').content).toEqual([
      { type: 'paragraph', content: [{ type: 'variable', attrs: { name: 'a' } }] },
    ]);
  });

  it('reads an empty body as one empty paragraph', () => {
    expect(fromSmsText('').content).toEqual([{ type: 'paragraph' }]);
    expect(toSmsText(fromSmsText(''))).toBe('');
  });

  it('measures a Vietnamese letter as UCS-2', () => {
    expect(measureSmsBody('ạ')).toMatchObject({ encoding: 'ucs2', limit: 70 });
  });

  it('counts segments at the concatenated size', () => {
    expect(measureSmsBody('a'.repeat(161)).segments).toBe(2);
    expect(measureSmsBody('a'.repeat(307)).segments).toBe(3);
  });
});
