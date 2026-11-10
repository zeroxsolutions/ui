import { useMemo } from 'react';
import { codeLanguageOptions, localeOptions } from '../lib/language-options';
import type { LanguageOption, LanguageOptionSource } from '../lib/language-options';

/**
 * The options a language picker offers: `options` when given, otherwise the built-in set for `kind` (default
 * `locale`). A locale picker given no `locales` offers only the current `value`, so it still shows what is
 * selected; an empty `value` then offers nothing. The array keeps its identity until an input changes.
 */
function useLanguageOptions({
  kind = 'locale',
  options,
  locales,
  value,
}: LanguageOptionSource & { value: string }): LanguageOption[] {
  return useMemo(() => {
    if (options) return options;
    if (kind === 'code') return codeLanguageOptions();
    return localeOptions(locales ?? (value ? [value] : []));
  }, [kind, options, locales, value]);
}

export { useLanguageOptions };
