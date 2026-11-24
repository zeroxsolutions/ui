import type { EmailTheme } from './theme.js';

/**
 * The class names an element painted with a theme colour carries, by what it paints, so the dark palette's
 * rules repaint it over its inline style. Gmail drops a rule keyed by element or id from a head style and
 * keeps one keyed by class, as with the narrow-screen rules.
 */
export const PAINT = {
  background: 'zx-bg',
  foreground: 'zx-fg',
  mutedForeground: 'zx-muted-fg',
  muted: 'zx-muted-bg',
  primary: 'zx-primary-bg',
  primaryForeground: 'zx-primary-fg',
  link: 'zx-link',
  border: 'zx-border',
} as const;

type Paint = keyof typeof PAINT;

/**
 * The `PAINT` class names of `paints`, to repaint an element in dark mode; none for a theme with no dark
 * palette, whose email stays as it was drawn before there was one.
 */
export function paintClasses(theme: EmailTheme, ...paints: readonly Paint[]): string[] {
  return theme.dark === undefined ? [] : paints.map((paint) => PAINT[paint]);
}

/** The class attribute of `names`, with its leading space; empty for none. */
export function classAttribute(...names: readonly (string | false)[]): string {
  const given = names.filter((name): name is string => name !== false);
  return given.length === 0 ? '' : ` class="${given.join(' ')}"`;
}

/** The head's color-scheme declarations: light and dark with a dark palette, none without one. */
export function colorSchemeMeta(theme: EmailTheme): string {
  return theme.dark === undefined
    ? ''
    : '<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">';
}

/** The rules that repaint each `PAINT` class with the dark palette in dark mode; empty without one. */
export function darkSchemeStyle(theme: EmailTheme): string {
  const dark = theme.dark;
  if (dark === undefined) return '';
  return (
    '@media (prefers-color-scheme:dark){' +
    `.${PAINT.background}{background:${dark.background} !important;}` +
    `.${PAINT.foreground}{color:${dark.foreground} !important;}` +
    `.${PAINT.mutedForeground}{color:${dark.mutedForeground} !important;}` +
    `.${PAINT.muted}{background:${dark.muted} !important;}` +
    `.${PAINT.primary}{background:${dark.primary} !important;}` +
    `.${PAINT.primaryForeground}{color:${dark.primaryForeground} !important;}` +
    `.${PAINT.link}{color:${dark.primary} !important;}` +
    `.${PAINT.border}{border-color:${dark.border} !important;}` +
    '}'
  );
}
