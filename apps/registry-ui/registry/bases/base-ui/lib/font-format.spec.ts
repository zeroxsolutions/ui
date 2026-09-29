import { describe, expect, it } from 'vitest';

import { formatOf } from './font-format';

describe('formatOf', () => {
  it('maps each font extension to its CSS format() hint', () => {
    expect(formatOf('/fonts/Inter.woff2')).toBe('woff2');
    expect(formatOf('/fonts/Inter.woff')).toBe('woff');
    expect(formatOf('/fonts/Inter.ttf')).toBe('truetype');
    expect(formatOf('/fonts/Inter.otf')).toBe('opentype');
    expect(formatOf('/fonts/Inter.eot')).toBe('embedded-opentype');
  });

  it('ignores a query string or fragment and the extension case', () => {
    expect(formatOf('https://cdn.example.com/Inter.TTF?v=3#x')).toBe('truetype');
  });

  it('gives no hint for an unknown extension', () => {
    expect(formatOf('/fonts/Inter.svg')).toBeUndefined();
  });
});
