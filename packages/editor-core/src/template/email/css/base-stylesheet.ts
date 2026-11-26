import {
  COLOR_TOKENS,
  SECTION_BACKGROUNDS,
  SPACES,
  VALIGNS,
  type ColorToken,
  type SectionBackground,
} from '../../layout/index.js';
import { SECTION_PADDING_PX } from '../blocks/section.js';
import { LANE_GUTTER, SPACE_PX } from '../blocks/shared.js';
import {
  DEFAULT_EMAIL_THEME,
  fontStack,
  resolveEmailTheme,
  tint,
  type EmailColors,
  type EmailTheme,
  type ResolvedEmailColors,
  type ResolvedEmailTheme,
} from '../theme.js';

/** The monospace list a code block sets its digits in, so each digit takes the same width. */
const MONOSPACE = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace";

/**
 * Under 600px the card loses its frame and gutter and fills the screen, body text and the button grow to
 * 16px, the button spans the card, and lanes stack. Footer text stays small.
 */
const NARROW_SCREEN_OPEN = '@media only screen and (max-width:600px){';
const NARROW_SCREEN_RULES =
  '.zx-outer{padding:0 !important;}' +
  '.zx-card{border:0 !important;border-radius:0 !important;}' +
  '.zx-inner{padding:24px 20px !important;}' +
  '.zx-text{font-size:16px !important;line-height:24px !important;}' +
  '.zx-region-footer .zx-text{font-size:12px !important;line-height:17px !important;}' +
  '.zx-footer-line{font-size:12px !important;line-height:17px !important;}' +
  '.zx-button{display:block !important;text-align:center !important;font-size:16px !important;line-height:22px !important;padding:12px 16px !important;}' +
  '.zx-lane{display:block !important;width:100% !important;padding:0 !important;}' +
  '.zx-caption{font-size:12px !important;line-height:17px !important;}' +
  '.zx-legal-text{font-size:12px !important;line-height:17px !important;}';

/** The rules that repaint the email with `dark` where a client reads `prefers-color-scheme` (Apple Mail, Outlook for Mac). */
function darkScheme(dark: EmailColors, extra: string): string {
  return (
    '@media (prefers-color-scheme:dark){' +
    `.zx-body{background:${dark.background} !important;}` +
    `.zx-canvas{background:${dark.background} !important;}` +
    `.zx-card{background:${dark.background} !important;border-color:${dark.border} !important;}` +
    `.zx-text{color:${dark.foreground} !important;}` +
    `.zx-heading{color:${dark.foreground} !important;}` +
    `.zx-tone-muted{color:${dark.mutedForeground} !important;}` +
    `.zx-region-footer .zx-text{color:${dark.mutedForeground} !important;}` +
    `.zx-footer-line{color:${dark.mutedForeground} !important;}` +
    `.zx-link{color:${dark.primary} !important;}` +
    `.zx-callout{background:${dark.muted} !important;border-color:${dark.border} !important;}` +
    `.zx-code{color:${dark.foreground} !important;background:${dark.muted} !important;}` +
    `.zx-button{background:${dark.primary} !important;color:${dark.primaryForeground} !important;}` +
    `.zx-divider{border-color:${dark.border} !important;}` +
    `.zx-quote{border-color:${dark.border} !important;}` +
    `.zx-table-cell{color:${dark.foreground} !important;border-color:${dark.border} !important;}` +
    `.zx-table-head{background:${dark.muted} !important;}` +
    `.zx-card-block{border-color:${dark.border} !important;}` +
    `.zx-footer{border-color:${dark.border} !important;}` +
    extra +
    '}'
  );
}

/** How much of a colour a background token's surface takes, over the page's background. */
const SURFACE_TINT = 0.15;

/** A colour token as text in `colors`; `default` draws no colour of its own. */
export function textColorOf(token: Paint, colors: ResolvedEmailColors): string {
  switch (token) {
    case 'muted':
      return colors.mutedForeground;
    case 'primary':
      return colors.primary;
    case 'accent':
      return colors.accent;
    default:
      return colors.hues[token];
  }
}

/** A colour token as a surface behind text or a section in `colors`: the muted surface, or a tint of the colour. */
export function surfaceColorOf(token: Paint, colors: ResolvedEmailColors): string {
  return token === 'muted' ? colors.muted : tint(textColorOf(token, colors), colors.background, SURFACE_TINT);
}

/** One class the layout model draws with: its light declarations, and its narrow-screen and dark ones where it has them. */
interface TokenRule {
  readonly light: string;
  readonly narrow?: string;
  readonly dark?: string;
}

type Paint = Exclude<ColorToken, 'default'>;

const PAINTS = COLOR_TOKENS.filter((token): token is Paint => token !== 'default');
const SECTION_SURFACES = SECTION_BACKGROUNDS.filter((token): token is Paint & SectionBackground => token !== 'none');
const VERTICAL_ALIGN = { top: 'top', center: 'middle', bottom: 'bottom' } as const;

/**
 * The layout model's classes, in the order the sheet writes them: each written only where a render uses it, so an
 * email with no layout attribute draws with the sheet it had before there were any.
 */
function tokenRules(theme: ResolvedEmailTheme): ReadonlyMap<string, TokenRule> {
  const { colors, dark } = theme;
  const rules: [string, TokenRule][] = [
    ['zx-space-none', { light: 'padding:0;' }],
    ...SPACES.map((space): [string, TokenRule] => [
      `zx-space-before-${space}`,
      { light: `padding-top:${SPACE_PX[space] === 0 ? '0' : `${SPACE_PX[space]}px`};` },
    ]),
    [
      'zx-text-lead',
      { light: 'font-size:18px;line-height:28px;', narrow: 'font-size:18px !important;line-height:28px !important;' },
    ],
    [
      'zx-text-small',
      { light: 'font-size:12px;line-height:17px;', narrow: 'font-size:12px !important;line-height:17px !important;' },
    ],
    ...VALIGNS.map((valign): [string, TokenRule] => [
      `zx-valign-${valign}`,
      { light: `vertical-align:${VERTICAL_ALIGN[valign]};` },
    ]),
    ...PAINTS.map((token): [string, TokenRule] => [
      `zx-color-${token}`,
      {
        light: `color:${textColorOf(token, colors)};`,
        ...(dark === undefined ? {} : { dark: `color:${textColorOf(token, dark)} !important;` }),
      },
    ]),
    ...PAINTS.map((token): [string, TokenRule] => [
      `zx-bg-${token}`,
      {
        light: `background:${surfaceColorOf(token, colors)};`,
        ...(dark === undefined ? {} : { dark: `background:${surfaceColorOf(token, dark)} !important;` }),
      },
    ]),
    ['zx-section', { light: `border-radius:${theme.radius}px;` }],
    ...SECTION_SURFACES.map((token): [string, TokenRule] => [
      `zx-section-bg-${token}`,
      {
        light: `background:${surfaceColorOf(token, colors)};`,
        ...(dark === undefined ? {} : { dark: `background:${surfaceColorOf(token, dark)} !important;` }),
      },
    ]),
    ...SPACES.map((space): [string, TokenRule] => [
      `zx-section-pad-${space}`,
      { light: `padding:${SECTION_PADDING_PX[space] === 0 ? '0' : `${SECTION_PADDING_PX[space]}px`};` },
    ]),
    ['zx-inner-flush-bottom', { light: 'padding-bottom:0;', narrow: 'padding-bottom:0 !important;' }],
    ['zx-inner-flush-top', { light: 'padding-top:0;', narrow: 'padding-top:0 !important;' }],
    ['zx-inner-wide', { light: 'padding:0;' }],
  ];
  return new Map(rules);
}

/** Every class of the layout model a sheet writes only where a render uses it. */
export const TOKEN_CLASSES: ReadonlySet<string> = new Set(tokenRules(DEFAULT_EMAIL_THEME).keys());

/**
 * The stylesheet every default block and the default layout are drawn by, its values taken from `theme`. A
 * product's sheet comes after it, so a product rule of equal specificity wins. The narrow-screen rules and
 * the dark palette's are head rules, class-keyed, as Gmail keeps only those; without `theme.dark` the email
 * has no dark rules and declares no dark scheme. Of `TOKEN_CLASSES`, only the classes in `used` are written.
 */
export function baseStylesheet(theme: EmailTheme, used: ReadonlySet<string> = new Set()): string {
  const { colors: c, radius } = theme;
  const font = fontStack(theme);
  const rules = [...tokenRules(resolveEmailTheme(theme))].filter(([name]) => used.has(name));
  const written = (part: keyof TokenRule): string =>
    rules.map(([name, rule]) => (rule[part] === undefined ? '' : `.${name}{${rule[part]}}`)).join('');
  return (
    `.zx-body{margin:0;padding:0;background:${c.background};}` +
    `.zx-canvas{background:${c.background};}` +
    '.zx-outer{padding:24px 12px;}' +
    `.zx-card{width:100%;max-width:600px;background:${c.background};border:1px solid ${c.border};border-radius:${radius}px;}` +
    '.zx-inner{padding:16px;}' +
    '.zx-preheader{display:none;max-height:0;overflow:hidden;mso-hide:all;}' +
    '.zx-image{display:block;border:0;height:auto;}' +
    '.zx-logo{padding:0 0 10px;}' +
    '.zx-align-left{text-align:left;}' +
    '.zx-align-center{text-align:center;}' +
    '.zx-align-right{text-align:right;}' +
    // `medium` is the 10px gap the design's mail frame puts between blocks.
    '.zx-space-small{padding:0 0 6px;}' +
    '.zx-space-medium{padding:0 0 10px;}' +
    '.zx-space-large{padding:0 0 20px;}' +
    `.zx-text{font-family:${font};font-size:14px;line-height:20px;color:${c.foreground};}` +
    `.zx-tone-muted{color:${c.mutedForeground};}` +
    `.zx-heading{margin:0;font-family:${font};font-weight:600;color:${c.foreground};}` +
    '.zx-heading-1{font-size:24px;line-height:32px;}' +
    '.zx-heading-2{font-size:20px;line-height:28px;}' +
    '.zx-heading-3{font-size:16px;line-height:24px;}' +
    '.zx-list{margin:0;padding-left:20px;}' +
    `.zx-link{color:${c.primary};}` +
    `.zx-callout{background:${c.muted};border:1px solid ${c.border};border-radius:${radius}px;padding:12px 16px;}` +
    `.zx-code{display:inline-block;font-family:${MONOSPACE};font-size:24px;font-weight:600;letter-spacing:4px;line-height:32px;white-space:pre-wrap;color:${c.foreground};background:${c.muted};border-radius:${radius}px;padding:12px 16px;}` +
    `.zx-button{display:inline-block;background:${c.primary};color:${c.primaryForeground};font-family:${font};font-size:14px;font-weight:500;line-height:18px;padding:7px 10px;border-radius:${radius}px;text-decoration:none;}` +
    '.zx-button.zx-width-full{display:block;text-align:center;}' +
    `.zx-divider{border-top:1px solid ${c.border};font-size:0;line-height:0;}` +
    '.zx-image-fluid{max-width:100%;}' +
    '.zx-align-center .zx-image-fluid{margin:0 auto;}' +
    '.zx-align-right .zx-image-fluid{margin:0 0 0 auto;}' +
    '.zx-caption{padding:6px 0 0;font-size:12px;line-height:17px;}' +
    `.zx-quote{border-left:3px solid ${c.border};padding:0 0 0 12px;}` +
    '.zx-table{border-collapse:collapse;}' +
    `.zx-table-cell{border:1px solid ${c.border};padding:6px 8px;font-family:${font};font-size:14px;line-height:20px;color:${c.foreground};text-align:left;vertical-align:top;}` +
    `.zx-table-head{font-weight:600;background:${c.muted};}` +
    '.zx-icon{padding:0 8px 0 0;}' +
    '.zx-icon-last{padding:0;}' +
    '.zx-icon-image{display:block;border:0;}' +
    '.zx-icons-center{margin:0 auto;}' +
    '.zx-icons-right{margin:0 0 0 auto;}' +
    '.zx-hero-heading,.zx-card-block-heading{padding:12px 0 4px;}' +
    '.zx-hero-action,.zx-card-block-action{padding:12px 0 0;}' +
    `.zx-card-block{border:1px solid ${c.border};border-radius:${radius}px;}` +
    `.zx-card-block-image{border-radius:${radius}px ${radius}px 0 0;}` +
    '.zx-card-block-body{padding:0 16px 16px;}' +
    '.zx-legal-text{padding:0 0 4px;font-size:12px;line-height:17px;}' +
    `.zx-lane{padding:0 ${LANE_GUTTER}px 0 0;}` +
    '.zx-lane-last{padding:0;}' +
    `.zx-footer{padding:10px 0 0;border-top:1px solid ${c.border};}` +
    `.zx-footer-line{margin:0 0 4px;font-size:12px;line-height:17px;color:${c.mutedForeground};}` +
    `.zx-region-footer .zx-text{font-size:12px;line-height:17px;color:${c.mutedForeground};}` +
    written('light') +
    NARROW_SCREEN_OPEN +
    NARROW_SCREEN_RULES +
    written('narrow') +
    '}' +
    (theme.dark === undefined ? '' : darkScheme(theme.dark, written('dark')))
  );
}
