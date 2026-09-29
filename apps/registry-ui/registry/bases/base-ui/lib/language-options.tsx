import { DocumentIcon } from '@zeroxsolutions/icons/material/document';

import { CODE_ALIASES, CODE_LANGUAGES } from '@/registry/bases/base-ui/constants/code-languages';
import type { LanguageIcon, LanguageOption } from '@/registry/bases/base-ui/types/language-option';

/** The canonical code id for a possibly-aliased value (`ts` -> `typescript`); unchanged if unknown. */
function canonicalCodeId(value: string): string {
  return CODE_ALIASES[value] ?? value;
}

const CODE_ICON_BY_ID: Record<string, LanguageIcon> = Object.fromEntries(CODE_LANGUAGES.map((l) => [l.id, l.Icon]));

/**
 * The full-color Material icon component for a code-language id, resolving
 * aliases (`ts` -> `typescript`) and falling back to a generic document icon for
 * ids outside the highlightable set. Lets other surfaces (e.g. a read-only
 * code-block header) show the same icons the language picker uses. Self-scales
 * at `size="1em"`.
 */
function codeLanguageIcon(id: string): LanguageIcon {
  return CODE_ICON_BY_ID[canonicalCodeId(id)] ?? DocumentIcon;
}

let cachedCodeOptions: LanguageOption[] | null = null;

/**
 * The built-in `kind="code"` options: every highlightable language as a
 * {@link LanguageOption} carrying its Material icon. Computed once; every call
 * returns the same array.
 */
function codeLanguageOptions(): LanguageOption[] {
  cachedCodeOptions ??= CODE_LANGUAGES.map(({ id, label, Icon }) => ({
    value: id,
    label,
    icon: <Icon aria-hidden />,
  }));
  return cachedCodeOptions;
}

/** The native language name for a BCP-47 code (`ja` -> its name in Japanese), or the raw code as fallback. */
function localeLabel(code: string): string {
  try {
    return new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * The built-in `kind="locale"` options: each BCP-47 code labelled with its own
 * native language name. Pass explicit `options` to the picker to override
 * these labels.
 */
function localeOptions(codes: readonly string[]): LanguageOption[] {
  return codes.map((code) => ({ value: code, label: localeLabel(code) }));
}

export { canonicalCodeId, codeLanguageIcon, codeLanguageOptions, localeOptions };
