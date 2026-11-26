import { z } from 'zod';
import { defineBlockType } from '../block.js';
import { VALIGNS } from '../../layout/index.js';
import { readOr, spaceAfter, spaceBefore } from './shared.js';

/** The most lanes, and the heaviest one lane may weigh against its siblings: a twelve-column grid. */
export const MAX_LANES = 4;
const COLUMN_WEIGHT_MAX = 12;

const attributes = z
  .object({
    ratio: z.array(z.number().int().positive().max(COLUMN_WEIGHT_MAX)).min(2).max(MAX_LANES),
    valign: z.enum(VALIGNS).optional(),
    spaceBefore,
    spaceAfter,
  })
  .strict();
const content = z.object({}).strict();
const lenientAttributes = z.object({
  ratio: z.array(z.number().positive()).catch([]),
  valign: z.enum(VALIGNS).optional().catch(undefined),
  spaceBefore: spaceBefore.catch(undefined),
  spaceAfter: spaceAfter.catch(undefined),
});

/** Lanes side by side, the only block that holds other blocks, one level deep. */
export const columns = defineBlockType({
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
  render({ attributes: a }, { h, lane }) {
    if (a.ratio.reduce((sum, weight) => sum + weight, 0) === 0) return [];
    return h.columns(
      a.valign === undefined ? {} : { valign: a.valign },
      a.ratio.map((weight, index) => h.column({ weight }, lane(index))),
    );
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
