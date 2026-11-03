import { describe, expect, it } from 'vitest';
import type { ThemedToken } from 'shiki/types';

import { styleForToken, tokensToRanges } from './code-syntax.js';

describe('styleForToken', () => {
  it('emits the color when present', () => {
    expect(styleForToken('var(--primary)')).toBe('color:var(--primary)');
  });

  it('maps the FontStyle bitflags (italic 1 · bold 2 · underline 4 · strike 8)', () => {
    expect(styleForToken(undefined, 1)).toBe('font-style:italic');
    expect(styleForToken(undefined, 2)).toBe('font-weight:bold');
    expect(styleForToken(undefined, 4)).toBe('text-decoration:underline');
    expect(styleForToken(undefined, 8)).toBe('text-decoration:line-through');
  });

  it('combines color with multiple style bits', () => {
    // 3 = italic | bold
    expect(styleForToken('var(--info)', 3)).toBe('color:var(--info);font-style:italic;font-weight:bold');
  });

  it('is empty for an unstyled token (e.g. whitespace)', () => {
    expect(styleForToken(undefined, 0)).toBe('');
    expect(styleForToken(undefined, undefined)).toBe('');
  });
});

describe('tokensToRanges', () => {
  // "const x\n  1" — offsets are absolute to the whole input.
  const tokens: ThemedToken[][] = [
    [
      { content: 'const', offset: 0, color: 'var(--shiki-token-keyword)' },
      { content: ' ', offset: 5 },
      { content: 'x', offset: 6, color: 'var(--foreground)' },
    ],
    [
      { content: '  ', offset: 8 },
      { content: '1', offset: 10, color: 'var(--shiki-token-constant)' },
    ],
  ];

  it('maps absolute offsets straight to document positions', () => {
    const ranges = tokensToRanges(tokens);
    expect(ranges).toEqual([
      { from: 0, to: 5, style: 'color:var(--shiki-token-keyword)' },
      { from: 6, to: 7, style: 'color:var(--foreground)' },
      { from: 10, to: 11, style: 'color:var(--shiki-token-constant)' },
    ]);
  });

  it('drops unstyled and zero-length tokens', () => {
    const ranges = tokensToRanges([
      [
        { content: '', offset: 0, color: 'var(--primary)' },
        { content: '   ', offset: 0 },
      ],
    ]);
    expect(ranges).toEqual([]);
  });

  it('yields ranges in ascending order for the RangeSetBuilder', () => {
    const ranges = tokensToRanges(tokens);
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i].from).toBeGreaterThanOrEqual(ranges[i - 1].to);
    }
  });
});
