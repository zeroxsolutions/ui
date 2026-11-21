import { z } from 'zod';
import { defineBlock } from '../block.js';
import { blockText, readOr, row, spaceAfter } from './shared.js';

const attributes = z.object({ spaceAfter }).strict();
const content = z.object({ html: blockText }).strict();
const lenientContent = z.object({ html: z.string().catch('') });

/** The authored markup with its tags dropped, for the text arm; dropped before the values are filled, so a value's own `<` survives. */
function withoutTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

/** Raw markup, written once and never translated: the only block an author can break the layout with. */
export const html = defineBlock({
  type: 'html',
  attributes,
  content,
  readAttributes: (raw) => readOr(attributes, raw, {}),
  readContent: (raw) => readOr(lenientContent, raw, { html: '' }),
  holdsText: true,
  holdsLanes: false,
  async translate(source) {
    return { ...source };
  },
  render({ attributes: a, content: c }, ctx) {
    return { html: row(a, ctx.markup(c.html)), text: `${ctx.text(withoutTags(c.html))}\n\n` };
  },
  sample: { attributes: {}, content: { html: '<p>Offer for {{name}}</p>' }, variableTypes: { name: 'string' } },
});
