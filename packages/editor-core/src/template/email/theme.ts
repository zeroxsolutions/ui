/**
 * The design-system values every default block and the default layout paint with, named as shadcn names its
 * tokens. Each is a literal a mail client reads: no client resolves a CSS variable or an `oklch()`, so a
 * product resolves its tokens to hex before handing them over.
 */
export interface EmailTheme {
  readonly colors: {
    readonly background: string;
    readonly foreground: string;
    readonly primary: string;
    readonly primaryForeground: string;
    readonly muted: string;
    readonly mutedForeground: string;
    readonly border: string;
  };
  /** In px. */
  readonly radius: number;
  readonly font: { readonly family: string; readonly fallback: string };
}

/** A theme value a renderer refused when it was composed, named by its path in the theme. */
export class EmailThemeInvalid extends Error {
  constructor(readonly path: string) {
    super(`The email theme's ${path} is not a value a mail client can read`);
    this.name = 'EmailThemeInvalid';
  }
}

const HEX_COLOUR = /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** A font list holds names, spaces, commas, hyphens and single quotes: nothing that closes a `style="..."`. */
const FONT_LIST = /^[\w ,'-]+$/;

/** @throws {EmailThemeInvalid} for the first value a mail client cannot read, or one that would leave its attribute */
export function assertEmailTheme(theme: EmailTheme): void {
  for (const [name, value] of Object.entries(theme.colors)) {
    if (!HEX_COLOUR.test(value)) throw new EmailThemeInvalid(`colors.${name}`);
  }
  if (!Number.isFinite(theme.radius) || theme.radius < 0) throw new EmailThemeInvalid('radius');
  if (!FONT_LIST.test(theme.font.family)) throw new EmailThemeInvalid('font.family');
  if (!FONT_LIST.test(theme.font.fallback)) throw new EmailThemeInvalid('font.fallback');
}

/** The theme's font as one CSS font-family list, the family first. */
export function fontStack(theme: EmailTheme): string {
  return `${theme.font.family}, ${theme.font.fallback}`;
}
