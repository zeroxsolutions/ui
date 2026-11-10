import type { ReactNode } from 'react';

/** The domain a language picker's built-in options are drawn from. */
type LanguageKind = 'locale' | 'code';

/**
 * One selectable language: a stable `value`, a display `label`, and an optional leading `icon`, which the
 * built-in options leave out.
 */
interface LanguageOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

/** Where a language picker's options come from: explicit `options`, or the built-in set for `kind`. */
interface LanguageOptionSource {
  /** Which built-in set to offer when `options` is absent. Defaults to `locale`. */
  kind?: LanguageKind;
  /** Explicit options; they replace the built-in set. */
  options?: LanguageOption[];
  /** For `kind="locale"` without `options`: the BCP-47 codes to offer. */
  locales?: readonly string[];
}

/**
 * The programming languages the design system can syntax-highlight, each with its display label. The web
 * table gives each a Material file-type icon drawn as DOM svg, which React Native cannot draw, so this one
 * has none; its spec fails when an id, a label or an alias differs from the web table's.
 */
const CODE_LANGUAGES: readonly { id: string; label: string }[] = [
  { id: 'markdown', label: 'Markdown' },
  { id: 'mermaid', label: 'Mermaid' },
  { id: 'latex', label: 'LaTeX' },
  { id: 'json', label: 'JSON' },
  { id: 'yaml', label: 'YAML' },
  { id: 'toml', label: 'TOML' },
  { id: 'ini', label: 'INI' },
  { id: 'xml', label: 'XML' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'scss', label: 'SCSS' },
  { id: 'less', label: 'Less' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'jsx', label: 'JSX' },
  { id: 'tsx', label: 'TSX' },
  { id: 'python', label: 'Python' },
  { id: 'shellscript', label: 'Shell' },
  { id: 'sql', label: 'SQL' },
  { id: 'dockerfile', label: 'Dockerfile' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'java', label: 'Java' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'swift', label: 'Swift' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'csharp', label: 'C#' },
  { id: 'php', label: 'PHP' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'lua', label: 'Lua' },
];

/**
 * Common code-fence aliases to the canonical id in {@link CODE_LANGUAGES}, so a value like `ts` or `py`, as an
 * editor's code block stores it, still resolves to its option.
 */
const CODE_ALIASES: Record<string, string> = {
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  kt: 'kotlin',
  cs: 'csharp',
  'c++': 'cpp',
  sh: 'shellscript',
  shell: 'shellscript',
  bash: 'shellscript',
  zsh: 'shellscript',
  console: 'shellscript',
  yml: 'yaml',
  md: 'markdown',
  htm: 'html',
};

/** The canonical code id for a possibly aliased value (`ts` to `typescript`); unchanged if unknown. */
function canonicalCodeId(value: string): string {
  return CODE_ALIASES[value] ?? value;
}

let cachedCodeOptions: LanguageOption[] | null = null;

/** The built-in `kind="code"` options, every highlightable language with no icon. Every call returns the same array. */
function codeLanguageOptions(): LanguageOption[] {
  cachedCodeOptions ??= CODE_LANGUAGES.map(({ id, label }) => ({ value: id, label }));
  return cachedCodeOptions;
}

/**
 * The native language name for a BCP-47 code (`ja` to its name in Japanese), or the code itself where the
 * runtime cannot name it. Hermes does not list `Intl.DisplayNames` among the Intl APIs it implements, so in a
 * native app a locale is likely to show as its code; pass `options` with labels of your own there.
 */
function localeLabel(code: string): string {
  try {
    return new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** The built-in `kind="locale"` options: each BCP-47 code labelled by {@link localeLabel}. */
function localeOptions(codes: readonly string[]): LanguageOption[] {
  return codes.map((code) => ({ value: code, label: localeLabel(code) }));
}

/**
 * The option carrying `value` among `options`. For `kind="code"` an alias also matches its canonical id (`ts`
 * finds `typescript`). A value no option carries comes back as a bare option labelled with the value itself,
 * so a picker still shows it; an empty value comes back as `undefined`.
 */
function findLanguageOption(
  options: readonly LanguageOption[],
  value: string,
  kind: LanguageKind,
): LanguageOption | undefined {
  const direct = options.find((o) => o.value === value);
  if (direct) return direct;
  if (kind === 'code') {
    const canonical = canonicalCodeId(value);
    const aliased = options.find((o) => o.value === canonical);
    if (aliased) return aliased;
  }
  return value ? { value, label: value } : undefined;
}

export { canonicalCodeId, codeLanguageOptions, findLanguageOption, localeOptions };
export type { LanguageKind, LanguageOption, LanguageOptionSource };
