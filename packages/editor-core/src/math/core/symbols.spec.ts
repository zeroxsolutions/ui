import { describe, expect, it } from 'vitest';
import { renderMath } from './render.js';
import { SYMBOL_GROUPS } from './symbols.js';

const ASCII = /^[\x20-\x7E]+$/;

describe('SYMBOL_GROUPS', () => {
  it('exposes the five expected groups', () => {
    expect(SYMBOL_GROUPS.map((group) => group.label)).toEqual([
      'Greek',
      'Operators',
      'Relations',
      'Delimiters',
      'Arrows',
    ]);
  });

  const everySymbol = SYMBOL_GROUPS.flatMap((group) => group.symbols);

  it('keeps every latex command ASCII and every preview a non-empty glyph', () => {
    for (const symbol of everySymbol) {
      expect(symbol.latex.startsWith('\\'), symbol.label).toBe(true);
      expect(ASCII.test(symbol.latex), symbol.latex).toBe(true);
      expect(symbol.preview.length, symbol.label).toBeGreaterThan(0);
    }
  });

  it('renders every symbol as valid LaTeX', () => {
    for (const symbol of everySymbol) {
      expect(renderMath(symbol.latex).ok, symbol.latex).toBe(true);
    }
  });
});
