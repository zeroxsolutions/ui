import { z } from 'zod';
import { defineBlock } from '../block.js';
import { readOr, row, spaceAfter } from './shared.js';
import { classAttribute, paintClasses } from '../color-scheme.js';

const attributes = z.object({ spaceAfter }).strict();
const content = z.object({}).strict();

/** A rule. It carries no text. */
export const divider = defineBlock({
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
  render({ attributes: a }, ctx) {
    const rule = `<div${classAttribute(...paintClasses(ctx.theme, 'border'))} style="border-top:1px solid ${ctx.theme.colors.border};font-size:0;line-height:0;">&nbsp;</div>`;
    return { html: row(a, rule), text: '\n' };
  },
  sample: { attributes: {}, content: {}, variableTypes: {} },
});
