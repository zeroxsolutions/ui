import { z } from 'zod';
import { defineBlockType } from '../block.js';
import { readOr, spaceAfter, spaceBefore } from './shared.js';

const attributes = z.object({ spaceBefore, spaceAfter }).strict();
const content = z.object({}).strict();

/** A rule. It carries no text. */
export const divider = defineBlockType({
  type: 'divider',
  attributes,
  content,
  readAttributes: (raw) => readOr(attributes, raw, {}),
  readContent: () => ({}),
  holdsText: false,
  holdsLanes: false,
  async translate(source) {
    return { ...source };
  },
  render(_block, { h }) {
    return h.divider();
  },
  sample: { attributes: {}, content: {}, variableTypes: {} },
});
