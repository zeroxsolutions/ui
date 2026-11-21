import { z } from 'zod';
import { defineBlock } from '../block.js';
import { align, inlineText, readOr, row, spaceAfter, textClassAttribute, textStyle } from './shared.js';

const attributes = z.object({ align, spaceAfter }).strict();
const content = z.object({ text: inlineText }).strict();
const lenientContent = z.object({ text: z.string().catch('') });

/** One boxed line for a warning. */
export const callout = defineBlock({
  type: 'callout',
  attributes,
  content,
  readAttributes: (raw) => readOr(attributes, raw, {}),
  readContent: (raw) => readOr(lenientContent, raw, { text: '' }),
  holdsText: true,
  holdsLanes: false,
  async translate(source, translateOne) {
    return { text: await translateOne(source.text) };
  },
  render({ attributes: a, content: c }, ctx) {
    const { colors, radius } = ctx.theme;
    const style = `background:${colors.muted};border-left:4px solid ${colors.primary};border-radius:${radius}px;padding:12px 16px;${textStyle(ctx.theme, ctx.region)}`;
    const drawn = ctx.inline(c.text);
    const box = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td${textClassAttribute(ctx.region)} style="${style}">${drawn.html}</td></tr></table>`;
    return { html: row(a, box), text: `${drawn.text}\n\n` };
  },
  sample: { attributes: {}, content: { text: '{{place}} is closed today.' }, variableTypes: { place: 'string' } },
});
