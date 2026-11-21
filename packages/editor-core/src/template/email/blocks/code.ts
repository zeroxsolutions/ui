import { z } from 'zod';
import { defineBlock } from '../block.js';
import { align, blockText, monospaceStyle, readOr, row, spaceAfter } from './shared.js';

const attributes = z.object({ align, spaceAfter }).strict();
const content = z.object({ code: blockText }).strict();
const lenientContent = z.object({ code: z.string().catch('') });

/** A one-time code, set large and letter-spaced. */
export const code = defineBlock({
  type: 'code',
  attributes,
  content,
  readAttributes: (raw) => readOr(attributes, raw, {}),
  readContent: (raw) => readOr(lenientContent, raw, { code: '' }),
  holdsText: true,
  holdsLanes: false,
  async translate(source) {
    return { ...source };
  },
  render({ attributes: a, content: c }, ctx) {
    const { colors, radius } = ctx.theme;
    const style =
      `display:inline-block;${monospaceStyle()}font-size:24px;font-weight:600;letter-spacing:4px;line-height:32px;` +
      `white-space:pre-wrap;color:${colors.foreground};background:${colors.muted};border-radius:${radius}px;padding:12px 16px;`;
    return { html: row(a, `<div style="${style}">${ctx.html(c.code)}</div>`), text: `${ctx.text(c.code)}\n\n` };
  },
  sample: { attributes: {}, content: { code: '{{code}}' }, variableTypes: { code: 'string' } },
});
