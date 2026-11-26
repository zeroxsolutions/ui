import { z } from 'zod';
import { defineBlockType } from '../block.js';
import { align, inlineText, readOr, spaceAfter, spaceBefore } from './shared.js';

const attributes = z.object({ align, spaceBefore, spaceAfter }).strict();
const content = z.object({ text: inlineText }).strict();
const lenientContent = z.object({ text: z.string().catch('') });

/** One boxed line for a warning, in the muted colour inside a border, as the document editor draws a callout. */
export const callout = defineBlockType({
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
  render({ content: c }, { h }) {
    return h.section({ class: 'zx-callout' }, [h.text({ markup: c.text })]);
  },
  sample: { attributes: {}, content: { text: '{{place}} is closed today.' }, variableTypes: { place: 'string' } },
});
