import { HUES, type Hue } from '../layout/index.js';

/** One palette, named as shadcn names its tokens, each a six- or eight-digit hex. */
export interface EmailColors {
  readonly background: string;
  readonly foreground: string;
  readonly primary: string;
  readonly primaryForeground: string;
  readonly muted: string;
  readonly mutedForeground: string;
  readonly border: string;
  /** The `accent` colour token's text colour; a background of it is drawn as a tint. The default's when absent. */
  readonly accent?: string;
  /** Each named hue's text colour; a background of it is drawn as a tint. The default's for each one absent. */
  readonly hues?: Partial<Record<Hue, string>>;
}

/** A palette with its accent and every hue filled. */
export interface ResolvedEmailColors extends EmailColors {
  readonly accent: string;
  readonly hues: Readonly<Record<Hue, string>>;
}

/**
 * The design-system values every default block and the default layout paint with. Each is a literal a mail
 * client reads: no client resolves a CSS variable or an `oklch()`, so a product resolves its tokens to hex
 * before handing them over.
 */
export interface EmailTheme {
  readonly colors: EmailColors;
  /**
   * The palette a client in dark mode paints with instead, where it reads `prefers-color-scheme` (Apple Mail,
   * Outlook for Mac). Without it the email declares no dark scheme, and such a client shows it light.
   */
  readonly dark?: EmailColors;
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
  for (const [palette, colors] of [
    ['colors', theme.colors],
    ['dark', theme.dark ?? {}],
  ] as const) {
    for (const [name, value] of Object.entries(colors)) {
      if (name === 'hues') continue;
      if (typeof value !== 'string' || !HEX_COLOUR.test(value)) throw new EmailThemeInvalid(`${palette}.${name}`);
    }
    for (const [hue, value] of Object.entries((colors as EmailColors).hues ?? {})) {
      if (typeof value !== 'string' || !HEX_COLOUR.test(value)) throw new EmailThemeInvalid(`${palette}.hues.${hue}`);
    }
  }
  if (!Number.isFinite(theme.radius) || theme.radius < 0) throw new EmailThemeInvalid('radius');
  if (!FONT_LIST.test(theme.font.family)) throw new EmailThemeInvalid('font.family');
  if (!FONT_LIST.test(theme.font.fallback)) throw new EmailThemeInvalid('font.fallback');
}

/** The theme's font as one CSS font-family list, the family first. */
export function fontStack(theme: EmailTheme): string {
  return `${theme.font.family}, ${theme.font.fallback}`;
}

/** The ZUI palette, light and dark, that a renderer composed with no theme draws with: hues at Tailwind's 600 and 400. */
export const DEFAULT_EMAIL_THEME = {
  colors: {
    background: '#FFFFFF',
    foreground: '#09090B',
    primary: '#007A55',
    primaryForeground: '#ECFDF5',
    muted: '#F4F4F5',
    mutedForeground: '#63636D',
    border: '#E4E4E7',
    accent: '#4F46E5',
    hues: {
      red: '#DC2626',
      orange: '#EA580C',
      amber: '#D97706',
      green: '#16A34A',
      teal: '#0D9488',
      blue: '#2563EB',
      violet: '#7C3AED',
      pink: '#DB2777',
    },
  },
  dark: {
    background: '#0A0A0A',
    foreground: '#FAFAFA',
    primary: '#00BC7D',
    primaryForeground: '#022C22',
    muted: '#262626',
    mutedForeground: '#A1A1A1',
    border: '#262626',
    accent: '#818CF8',
    hues: {
      red: '#F87171',
      orange: '#FB923C',
      amber: '#FBBF24',
      green: '#4ADE80',
      teal: '#2DD4BF',
      blue: '#60A5FA',
      violet: '#A78BFA',
      pink: '#F472B6',
    },
  },
  radius: 10,
  font: { family: 'Inter', fallback: 'Arial, Helvetica, sans-serif' },
} as const satisfies EmailTheme & { readonly colors: ResolvedEmailColors; readonly dark: ResolvedEmailColors };

/** A theme with every palette's accent and hues filled. */
export interface ResolvedEmailTheme extends EmailTheme {
  readonly colors: ResolvedEmailColors;
  readonly dark?: ResolvedEmailColors;
}

function resolveColors(colors: EmailColors, fallback: ResolvedEmailColors): ResolvedEmailColors {
  const hues = Object.fromEntries(HUES.map((hue) => [hue, colors.hues?.[hue] ?? fallback.hues[hue]]));
  return { ...colors, accent: colors.accent ?? fallback.accent, hues: hues as Record<Hue, string> };
}

/** `theme` with each absent accent and hue taken from `DEFAULT_EMAIL_THEME`'s palette of the same scheme. */
export function resolveEmailTheme(theme: EmailTheme): ResolvedEmailTheme {
  const { dark, ...rest } = theme;
  return {
    ...rest,
    colors: resolveColors(theme.colors, DEFAULT_EMAIL_THEME.colors),
    ...(dark === undefined ? {} : { dark: resolveColors(dark, DEFAULT_EMAIL_THEME.dark) }),
  };
}

function channels(hex: string): [number, number, number] {
  return [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16)) as [number, number, number];
}

/**
 * `hue` mixed into `base`, `amount` of the way from `base` (0) to `hue` (1), as a six-digit hex: the surface a
 * background colour token is drawn on, so text in the foreground stays readable on it. An eight-digit hex's alpha
 * is ignored.
 */
export function tint(hue: string, base: string, amount: number): string {
  const [from, to] = [channels(base), channels(hue)];
  return `#${from
    .map((channel, index) => Math.round(channel + (to[index] - channel) * amount))
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}
