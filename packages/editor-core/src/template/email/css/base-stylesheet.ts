import { fontStack, type EmailColors, type EmailTheme } from '../theme.js';

/** The monospace list a code block sets its digits in, so each digit takes the same width. */
const MONOSPACE = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace";

/**
 * Under 600px the card loses its frame and gutter and fills the screen, body text and the button grow to
 * 16px, the button spans the card, and lanes stack. Footer text stays small.
 */
const NARROW_SCREEN =
  '@media only screen and (max-width:600px){' +
  '.zx-outer{padding:0 !important;}' +
  '.zx-card{border:0 !important;border-radius:0 !important;}' +
  '.zx-inner{padding:24px 20px !important;}' +
  '.zx-text{font-size:16px !important;line-height:24px !important;}' +
  '.zx-region-footer .zx-text{font-size:12px !important;line-height:17px !important;}' +
  '.zx-footer-line{font-size:12px !important;line-height:17px !important;}' +
  '.zx-button{display:block !important;text-align:center !important;font-size:16px !important;line-height:22px !important;padding:12px 16px !important;}' +
  '.zx-lane{display:block !important;width:100% !important;padding:0 !important;}' +
  '}';

/** The rules that repaint the email with `dark` where a client reads `prefers-color-scheme` (Apple Mail, Outlook for Mac). */
function darkScheme(dark: EmailColors): string {
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
    `.zx-footer{border-color:${dark.border} !important;}` +
    '}'
  );
}

/**
 * The stylesheet every default block and the default layout are drawn by, its values taken from `theme`. A
 * product's sheet comes after it, so a product rule of equal specificity wins. The narrow-screen rules and
 * the dark palette's are head rules, class-keyed, as Gmail keeps only those; without `theme.dark` the email
 * has no dark rules and declares no dark scheme.
 */
export function baseStylesheet(theme: EmailTheme): string {
  const { colors: c, radius } = theme;
  const font = fontStack(theme);
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
    '.zx-lane{padding:0 8px 0 0;}' +
    '.zx-lane-last{padding:0;}' +
    `.zx-footer{padding:10px 0 0;border-top:1px solid ${c.border};}` +
    `.zx-footer-line{margin:0 0 4px;font-size:12px;line-height:17px;color:${c.mutedForeground};}` +
    `.zx-region-footer .zx-text{font-size:12px;line-height:17px;color:${c.mutedForeground};}` +
    NARROW_SCREEN +
    (theme.dark === undefined ? '' : darkScheme(theme.dark))
  );
}
