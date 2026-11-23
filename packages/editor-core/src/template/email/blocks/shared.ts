import { z } from 'zod';
import { parseInlineMarkup } from '../../markup/inline-markup.js';
import { classAttribute, paintClasses } from '../color-scheme.js';
import { NARROW } from '../narrow-screen.js';
import type { Region } from '../region.js';
import { fontStack, type EmailTheme } from '../theme.js';

/** The longest text one block holds, a button's label and href, and the most items a list holds. */
export const BLOCK_TEXT_MAX_LENGTH = 5000;
export const BUTTON_LABEL_MAX_LENGTH = 200;
export const BUTTON_HREF_MAX_LENGTH = 2000;
export const LIST_MAX_ITEMS = 20;

/** One block's text on a write: present, and bounded. */
export const blockText = z.string().min(1).max(BLOCK_TEXT_MAX_LENGTH);

/**
 * A text block's text on a write: `blockText` that also parses as inline markup, so a stray `**` is refused
 * where it is saved rather than drawn as a literal. The bound counts the stored string, markers included.
 */
export const inlineText = blockText.refine((text) => parseInlineMarkup(text).ok, {
  message: 'malformed inline markup',
});

export const ALIGNS = ['left', 'center', 'right'] as const;
export const SPACES = ['small', 'medium', 'large'] as const;
export type Align = (typeof ALIGNS)[number];
export type Space = (typeof SPACES)[number];

/** The gap under a block, in px. `medium` is the 10px gap the design's mail frame puts between blocks. */
const SPACE_PX: Record<Space, number> = { small: 6, medium: 10, large: 20 };

export const align = z.enum(ALIGNS).optional();
export const spaceAfter = z.enum(SPACES).optional();

/** The monospace list a code block sets its digits in, so each digit takes the same width. */
const MONOSPACE = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace";

/**
 * Text in `region`: 12px over 17px and muted in the footer, as the default layout's footer lines are, and
 * 14px over 20px in the theme's foreground elsewhere. `color` overrides the region's default.
 */
export function textStyle(theme: EmailTheme, region: Region | 'body', color?: string): string {
  const footer = region === 'footer';
  const size = footer ? 'font-size:12px;line-height:17px;' : 'font-size:14px;line-height:20px;';
  const fill = color ?? (footer ? theme.colors.mutedForeground : theme.colors.foreground);
  return `font-family:${fontStack(theme)};${size}color:${fill};`;
}

/**
 * The class attribute, with its leading space, of text in `region`: the class a phone grows text by, which
 * the footer leaves out as its text stays small, then the classes the dark palette repaints it by, its text
 * muted in the footer or for a muted `tone`, and `extra`.
 */
export function textClassAttribute(
  theme: EmailTheme,
  region: Region | 'body',
  tone?: 'foreground' | 'mutedForeground',
  ...extra: readonly ('muted' | 'accent')[]
): string {
  const footer = region === 'footer';
  return classAttribute(
    !footer && NARROW.text,
    ...paintClasses(theme, tone ?? (footer ? 'mutedForeground' : 'foreground'), ...extra),
  );
}

export function monospaceStyle(): string {
  return `font-family:${MONOSPACE};`;
}

/** One block's row: its own cell, aligned and spaced after by its attributes. */
export function row(attributes: { readonly align?: Align; readonly spaceAfter?: Space }, inner: string): string {
  const style = `padding:0 0 ${SPACE_PX[attributes.spaceAfter ?? 'medium']}px;text-align:${attributes.align ?? 'left'};`;
  return `<tr><td style="${style}">${inner}</td></tr>`;
}

/** `schema.parse(raw)`, or `fallback` where `raw` is not that shape. */
export function readOr<T>(schema: z.ZodType<T>, raw: unknown, fallback: T): T {
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : fallback;
}
