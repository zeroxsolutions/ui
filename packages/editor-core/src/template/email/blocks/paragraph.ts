import { z } from 'zod';
import { defineBlockType } from '../block.js';
import { align, inlineText, readOr, spaceAfter } from './shared.js';

const TONES = ['default', 'muted'] as const;

const attributes = z.object({ align, spaceAfter, tone: z.enum(TONES).optional() }).strict();
const content = z.object({ text: inlineText }).strict();
const lenientContent = z.object({ text: z.string().catch('') });

/** One or more sentences. */
export const paragraph = defineBlockType({
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
  render({ attributes: a, content: c }, { h }) {
    return h.text({ class: `zx-tone-${a.tone ?? 'default'}`, markup: c.text });
  },
  sample: { attributes: {}, content: { text: 'Hi {{name}},' }, variableTypes: { name: 'string' } },
});
