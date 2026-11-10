import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { canonicalCodeId, codeLanguageOptions, findLanguageOption, localeOptions } from './language-options';

const WEB_SOURCE = readFileSync(
  require.resolve('@zeroxsolutions/ui/registry/bases/base-ui/lib/language-options.tsx'),
  'utf8',
);
const NATIVE_SOURCE = readFileSync(join(__dirname, 'language-options.ts'), 'utf8');

/** The `{ id, label }` rows of a source's CODE_LANGUAGES table, in order. */
function codeLanguagesOf(source: string): { value: string; label: string }[] {
  return [...source.matchAll(/\{ id: '([^']+)', label: '([^']+)'/g)].map(([, value, label]) => ({ value, label }));
}

/** A source's CODE_ALIASES table, alias to canonical id. */
function aliasesOf(source: string): Record<string, string> {
  const block = /const CODE_ALIASES: Record<string, string> = \{([^}]*)\}/.exec(source)?.[1] ?? '';
  return Object.fromEntries(
    [...block.matchAll(/^\s*'?([^':\s]+)'?: '([^']+)',$/gm)].map(([, alias, id]) => [alias, id]),
  );
}

describe('language options', () => {
  it('reads the tables of the web source', () => {
    expect(codeLanguagesOf(WEB_SOURCE).length).toBeGreaterThan(0);
    expect(Object.keys(aliasesOf(WEB_SOURCE)).length).toBeGreaterThan(0);
  });

  it("offers the web table's code languages, with its ids and labels, in its order", () => {
    expect(codeLanguageOptions()).toEqual(codeLanguagesOf(WEB_SOURCE));
  });

  it("holds the web table's aliases, and resolves each to its canonical id", () => {
    const web = aliasesOf(WEB_SOURCE);
    expect(aliasesOf(NATIVE_SOURCE)).toEqual(web);
    for (const [alias, id] of Object.entries(web)) expect(canonicalCodeId(alias)).toBe(id);
  });

  it('returns a canonical or unknown id unchanged', () => {
    expect(canonicalCodeId('typescript')).toBe('typescript');
    expect(canonicalCodeId('brainfuck')).toBe('brainfuck');
  });

  it('labels a locale with its own name when the runtime names it, and with its code when it cannot', () => {
    expect(localeOptions(['en'])).toEqual([{ value: 'en', label: 'English' }]);
    expect(localeOptions(['not a tag'])).toEqual([{ value: 'not a tag', label: 'not a tag' }]);
  });

  describe('findLanguageOption', () => {
    const options = [
      { value: 'typescript', label: 'TypeScript' },
      { value: 'python', label: 'Python' },
    ];

    it('finds the option carrying the value, and a code option through its alias', () => {
      expect(findLanguageOption(options, 'python', 'code')).toBe(options[1]);
      expect(findLanguageOption(options, 'ts', 'code')).toBe(options[0]);
    });

    it('does not alias a locale value, which comes back as a bare option labelled with itself', () => {
      expect(findLanguageOption(options, 'ts', 'locale')).toEqual({ value: 'ts', label: 'ts' });
    });

    it('returns undefined for an empty value', () => {
      expect(findLanguageOption(options, '', 'code')).toBeUndefined();
    });
  });
});
