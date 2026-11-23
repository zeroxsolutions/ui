import { z } from 'zod';
import { defineBlock } from '../block.js';
import { NARROW } from '../narrow-screen.js';
import { fontStack } from '../theme.js';
import { align, BUTTON_HREF_MAX_LENGTH, BUTTON_LABEL_MAX_LENGTH, readOr, row, spaceAfter } from './shared.js';

const attributes = z.object({ align, spaceAfter, width: z.enum(['inline', 'full']).optional() }).strict();
const content = z
  .object({
    label: z.string().min(1).max(BUTTON_LABEL_MAX_LENGTH),
    href: z.string().min(1).max(BUTTON_HREF_MAX_LENGTH),
  })
  .strict();
const lenientContent = z.object({ label: z.string().catch(''), href: z.string().catch('') });

/** A label and a link; the link opens with a literal scheme or a url variable, and may hold any token after it. */
export const button = defineBlock({
  type: 'button',
  attributes,
  content,
  readAttributes: (raw) => readOr(attributes, raw, {}),
  readContent: (raw) => readOr(lenientContent, raw, { label: '', href: '' }),
  holdsText: true,
  holdsLanes: false,
  async translate(source, translateOne) {
    return { label: await translateOne(source.label), href: source.href };
  },
  render({ attributes: a, content: c }, ctx) {
    const { colors, radius } = ctx.theme;
    const href = ctx.href(c.href);
    const full = a.width === 'full';
    const style =
      `display:${full ? 'block' : 'inline-block'};${full ? 'text-align:center;' : ''}` +
      `background:${colors.primary};color:${colors.primaryForeground};font-family:${fontStack(ctx.theme)};` +
      `font-size:14px;font-weight:500;line-height:18px;padding:7px 10px;border-radius:${radius}px;text-decoration:none;`;
    return {
      html: row(a, `<a href="${href.html}" class="${NARROW.button}" style="${style}">${ctx.html(c.label)}</a>`),
      text: `${ctx.text(c.label)}: ${href.text}\n\n`,
    };
  },
  sample: {
    attributes: {},
    content: { label: 'Verify email', href: '{{verify_url}}' },
    variableTypes: { verify_url: 'url' },
  },
});
