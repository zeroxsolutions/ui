import { z } from 'zod';
import { defineBlockType } from '../block.js';
import { blockText, readOr, spaceAfter, spaceBefore } from './shared.js';

const attributes = z.object({ spaceBefore, spaceAfter }).strict();
const content = z.object({ html: blockText }).strict();
const lenientContent = z.object({ html: z.string().catch('') });

/** Raw markup, written once and never translated: the only block an author can break the layout with. */
export const html = defineBlockType({
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
  render({ content: c }, { h }) {
    return h.raw({ markup: c.html });
  },
  sample: { attributes: {}, content: { html: '<p>Offer for {{name}}</p>' }, variableTypes: { name: 'string' } },
});
