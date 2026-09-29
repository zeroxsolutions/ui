import { cleanup, render } from '@testing-library/react';
import { DocumentIcon } from '@zeroxsolutions/icons/material/document';
import { TypescriptIcon } from '@zeroxsolutions/icons/material/typescript';
import { afterEach, describe, expect, it } from 'vitest';

import { canonicalCodeId, codeLanguageIcon, codeLanguageOptions, localeOptions } from './language-options';
import { CODE_LANGUAGE_IDS } from './shiki';

afterEach(cleanup);

describe('canonicalCodeId', () => {
  it('resolves a code-fence alias to its canonical id', () => {
    expect(canonicalCodeId('ts')).toBe('typescript');
    expect(canonicalCodeId('sh')).toBe('shellscript');
    expect(canonicalCodeId('c++')).toBe('cpp');
  });

  it('returns a canonical or unknown id unchanged', () => {
    expect(canonicalCodeId('typescript')).toBe('typescript');
    expect(canonicalCodeId('brainfuck')).toBe('brainfuck');
  });
});

describe('codeLanguageIcon', () => {
  it('finds the icon through an alias', () => {
    expect(codeLanguageIcon('ts')).toBe(TypescriptIcon);
    expect(codeLanguageIcon('typescript')).toBe(TypescriptIcon);
  });

  it('falls back to the document icon for a language outside the highlightable set', () => {
    expect(codeLanguageIcon('brainfuck')).toBe(DocumentIcon);
  });
});

describe('codeLanguageOptions', () => {
  it('offers every highlightable language, each labelled and iconed', () => {
    const options = codeLanguageOptions();
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(option.value).toBeTruthy();
      expect(option.label).toBeTruthy();
      expect(option.icon).toBeTruthy();
    }
  });

  it('renders a Material svg icon for a code language', () => {
    const ts = codeLanguageOptions().find((o) => o.value === 'typescript');
    const { container } = render(<>{ts?.icon}</>);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('stays in sync with the highlighter language set (no drift)', () => {
    const ids = codeLanguageOptions().map((o) => o.value);
    expect([...ids].sort()).toEqual([...CODE_LANGUAGE_IDS].sort());
  });
});

describe('localeOptions', () => {
  it('labels each BCP-47 code with its native language name', () => {
    const byValue = Object.fromEntries(localeOptions(['en', 'vi', 'ja']).map((o) => [o.value, o.label]));
    expect(byValue.en).toBe('English');
    // A name was resolved (not the raw code) for the non-English locales.
    expect(byValue.vi).not.toBe('vi');
    expect(byValue.ja).not.toBe('ja');
  });

  it('falls back to the raw code when it is not a valid language tag', () => {
    expect(localeOptions(['not a tag'])).toEqual([{ value: 'not a tag', label: 'not a tag' }]);
  });
});
