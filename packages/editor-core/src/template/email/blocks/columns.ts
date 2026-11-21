import { z } from 'zod';
import { defineBlock } from '../block.js';
import { NARROW } from '../narrow-screen.js';
import { readOr, row, spaceAfter } from './shared.js';

/** The most lanes, and the heaviest one lane may weigh against its siblings: a twelve-column grid. */
export const MAX_LANES = 4;
const COLUMN_WEIGHT_MAX = 12;

const attributes = z
  .object({ ratio: z.array(z.number().int().positive().max(COLUMN_WEIGHT_MAX)).min(2).max(MAX_LANES), spaceAfter })
  .strict();
const content = z.object({}).strict();
const lenientAttributes = z.object({
  ratio: z.array(z.number().positive()).catch([]),
  spaceAfter: spaceAfter.catch(undefined),
});

/** Lanes side by side, the only block that holds other blocks, one level deep. */
export const columns = defineBlock({
  type: 'columns',
  attributes,
  content,
  readAttributes: (raw) => readOr(lenientAttributes, raw, { ratio: [] }),
  readContent: () => ({}),
  holdsText: false,
  holdsLanes: true,
  async translate(source) {
    return { ...source };
  },
  render({ attributes: a }, ctx) {
    const total = a.ratio.reduce((sum, weight) => sum + weight, 0);
    if (total === 0) return { html: '', text: '' };
    const lanes = a.ratio.map((weight, index) => ({ weight, rendered: ctx.lane(index) }));
    const cells = lanes
      .map(
        ({ weight, rendered }, index) =>
          `<td width="${Math.round((weight / total) * 100)}%" valign="top" class="${NARROW.lane}" style="padding:0 ${index < lanes.length - 1 ? 8 : 0}px 0 0;">` +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rendered.html}</table></td>`,
      )
      .join('');
    const table = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${cells}</tr></table>`;
    return { html: row(a, table), text: lanes.map(({ rendered }) => rendered.text).join('') };
  },
  sample: {
    attributes: { ratio: [1, 1] },
    content: {},
    variableTypes: { name: 'string' },
    lanes: [
      [{ id: 'sample-left', type: 'paragraph', attributes: {}, content: { text: 'Left for {{name}}' } }],
      [{ id: 'sample-right', type: 'paragraph', attributes: {}, content: { text: 'Right' } }],
    ],
  },
});
