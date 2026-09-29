import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react';

/** The domain a language picker's built-in options are drawn from. */
type LanguageKind = 'locale' | 'code';

/** One selectable language: a stable `value`, a display `label`, an optional leading icon. */
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

/** A Material icon component: scales by `size` and accepts the usual svg props (`className`, ...). */
type LanguageIcon = FC<{ size?: string | number } & ComponentPropsWithoutRef<'svg'>>;

export type { LanguageKind, LanguageOption, LanguageOptionSource, LanguageIcon };
