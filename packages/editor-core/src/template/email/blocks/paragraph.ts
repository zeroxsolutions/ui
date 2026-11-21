import { z } from 'zod';
import { defineBlock } from '../block.js';
import { align, inlineText, readOr, row, spaceAfter, textClassAttribute, textStyle } from './shared.js';

const TONES = ['default', 'muted'] as const;

const attributes = z.object({ align, spaceAfter, tone: z.enum(TONES).optional() }).strict();
const content = z.object({ text: inlineText }).strict();
const lenientContent = z.object({ text: z.string().catch('') });

/** One or more sentences. */
export const paragraph = defineBlock({
  type: 'paragraph',
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
    const color = a.tone === 'muted' ? ctx.theme.colors.mutedForeground : undefined;
    const drawn = ctx.inline(c.text);
    return {
      html: row(
        a,
        `<div${textClassAttribute(ctx.region)} style="${textStyle(ctx.theme, ctx.region, color)}">${drawn.html}</div>`,
      ),
      text: `${drawn.text}\n\n`,
    };
  },
  sample: { attributes: {}, content: { text: 'Hi {{name}},' }, variableTypes: { name: 'string' } },
});
