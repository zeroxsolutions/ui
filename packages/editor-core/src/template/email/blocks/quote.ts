import { z } from 'zod';
import { defineBlockType } from '../block.js';
import { align, inlineText, readOr, spaceAfter } from './shared.js';

const attributes = z.object({ align, spaceAfter }).strict();
const content = z.object({ text: inlineText }).strict();
const lenientContent = z.object({ text: z.string().catch('') });

/** Words quoted from someone, set off by a rule at their left in the muted colour. */
export const quote = defineBlockType({
  type: 'quote',
  attributes,
  content,
  readAttributes: (raw) => readOr(attributes, raw, {}),
  readContent: (raw) => readOr(lenientContent, raw, { text: '' }),
  holdsText: true,
  holdsLanes: false,
  async translate(source, translateOne) {
    return { text: await translateOne(source.text) };
  },
  render({ content: c }, { h }) {
    return h.section({ class: 'zx-quote' }, [h.text({ class: 'zx-tone-muted', markup: c.text })]);
  },
  sample: { attributes: {}, content: { text: '{{name}} loved the tour.' }, variableTypes: { name: 'string' } },
});
