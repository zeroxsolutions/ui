import { describe, expect, it } from 'vitest';

import { isPlainLanguage, languageLabel } from './code-language';

describe('isPlainLanguage', () => {
  it('holds for no language and for the plain-text names, in any case', () => {
    expect(isPlainLanguage(undefined)).toBe(true);
    expect(isPlainLanguage('')).toBe(true);
    expect(isPlainLanguage('text')).toBe(true);
    expect(isPlainLanguage('PlainText')).toBe(true);
    expect(isPlainLanguage('txt')).toBe(true);
  });

  it('does not hold for a language with a grammar', () => {
    expect(isPlainLanguage('ts')).toBe(false);
  });
});

describe('languageLabel', () => {
  it('names a language id or alias, case-insensitively', () => {
    expect(languageLabel('ts')).toBe('TypeScript');
    expect(languageLabel('TSX')).toBe('TSX');
    expect(languageLabel('bash')).toBe('Shell');
  });

  it('returns an unlisted id as given', () => {
    expect(languageLabel('Brainfuck')).toBe('Brainfuck');
  });
});
