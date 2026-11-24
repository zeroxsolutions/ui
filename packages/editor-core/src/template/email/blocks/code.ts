import { z } from 'zod';
import { defineBlock } from '../block.js';
import { align, blockText, readOr, spaceAfter } from './shared.js';

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
  render({ content: c }, { h }) {
    return h.code({ text: c.code });
  },
  sample: { attributes: {}, content: { code: '{{code}}' }, variableTypes: { code: 'string' } },
});
