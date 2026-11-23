import { escapeHtml } from '../variables/interpolate.js';
import type { RenderedBlock } from './block.js';
import { classAttribute, colorSchemeMeta, darkSchemeStyle, paintClasses } from './color-scheme.js';
import { NARROW, NARROW_SCREEN_STYLE } from './narrow-screen.js';
import type { Region } from './region.js';
import { fontStack, type EmailTheme } from './theme.js';

/** What a layout frames: the blocks already rendered, the inbox lines, and the product's own props. */
export interface LayoutInput<Props> {
  readonly body: RenderedBlock;
  /** Each region already rendered; empty where the render was given none. */
  readonly regions: Readonly<Record<Region, RenderedBlock>>;
  readonly subject: string;
  /** Empty where the template has none. */
  readonly preheader: string;
  readonly locale: string;
  readonly theme: EmailTheme;
  readonly props: Props;
}

/** The frame around the body: the document, the card at most 600px wide, the preheader, the header and the footer. */
export type EmailLayout<Props> = (input: LayoutInput<Props>) => RenderedBlock;

/** What the default layout prints that only the product knows. */
export interface DefaultLayoutProps {
  /** A hosted PNG at 2x: mail clients render no SVG, and images are off by default, so the alt text is read first. */
  readonly logo: { readonly url: string; readonly alt: string; readonly width: number };
  /** In the send's locale, top to bottom: legal name and address, support address, the notice. */
  readonly footer: readonly string[];
}

const TABLE = 'role="presentation" cellpadding="0" cellspacing="0"';

/** The design's mail frame: a bordered card, the logo top left, the blocks, then the footer lines under a rule. */
export const defaultLayout: EmailLayout<DefaultLayoutProps> = ({
  body,
  regions,
  subject,
  preheader,
  locale,
  theme,
  props,
}) => {
  const { colors, radius } = theme;
  const footer = props.footer
    .map(
      (line) =>
        `<p${classAttribute(...paintClasses(theme, 'mutedForeground'))} style="margin:0 0 4px;font-family:${fontStack(theme)};font-size:12px;line-height:17px;color:${colors.mutedForeground};">${escapeHtml(line)}</p>`,
    )
    .join('');
  const logo = `<img src="${escapeHtml(props.logo.url)}" alt="${escapeHtml(props.logo.alt)}" width="${Math.round(props.logo.width)}" style="display:block;border:0;height:auto;" />`;
  const html = [
    '<!doctype html>',
    `<html lang="${escapeHtml(locale)}">`,
    `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${colorSchemeMeta(theme)}<title>${escapeHtml(subject)}</title><style>${NARROW_SCREEN_STYLE}${darkSchemeStyle(theme)}</style></head>`,
    `<body${classAttribute(...paintClasses(theme, 'background'))} style="margin:0;padding:0;background:${colors.background};">`,
    preheader === ''
      ? ''
      : `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>`,
    `<table ${TABLE} width="100%"${classAttribute(...paintClasses(theme, 'background'))} style="background:${colors.background};"><tr><td align="center" class="${NARROW.outer}" style="padding:24px 12px;">`,
    // Outlook on Windows reads no max-width, so it alone gets a fixed 600px table around the card. Every
    // other client sizes the card by style, so a phone client never sees a 600px width to scale down.
    '<!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0"><tr><td><![endif]-->',
    `<table ${TABLE}${classAttribute(NARROW.card, ...paintClasses(theme, 'background', 'border'))} style="width:100%;max-width:600px;background:${colors.background};border:1px solid ${colors.border};border-radius:${radius}px;">`,
    `<tr><td class="${NARROW.inner}" style="padding:16px;"><table ${TABLE} width="100%">`,
    `<tr><td style="padding:0 0 10px;">${logo}</td></tr>`,
    regions.header.html,
    body.html,
    `<tr><td${classAttribute(...paintClasses(theme, 'border'))} style="padding:10px 0 0;border-top:1px solid ${colors.border};">${
      regions.footer.html === '' ? '' : `<table ${TABLE} width="100%">${regions.footer.html}</table>`
    }${footer}</td></tr>`,
    '</table></td></tr></table>',
    '<!--[if mso]></td></tr></table><![endif]-->',
    '</td></tr></table>',
    '</body></html>',
  ].join('');
  const headerText = regions.header.text.trim();
  const bodyText = body.text.trim();
  const footerText = regions.footer.text.trim();
  const text = [
    ...(headerText === '' ? [] : [headerText, '']),
    ...(bodyText === '' ? [] : [bodyText, '']),
    ...(footerText === '' ? [] : [footerText]),
    ...props.footer,
  ]
    .join('\n')
    .trim();
  return { html, text };
};
