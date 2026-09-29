import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react';

/** The domain a language picker's built-in options are drawn from. */
type LanguageKind = 'locale' | 'code';

/** One selectable language: a stable `value`, a display `label`, an optional leading icon. */
interface LanguageOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

/** A Material icon component: scales by `size` and accepts the usual svg props (`className`, ...). */
type LanguageIcon = FC<{ size?: string | number } & ComponentPropsWithoutRef<'svg'>>;

export type { LanguageKind, LanguageOption, LanguageIcon };
