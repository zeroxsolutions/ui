import { builtInEmailBlockOf } from '../define-email-block.js';
import { choice } from '../fields.js';

/** The heights a spacer takes, in px: a breath, a gap, a break between parts. */
const HEIGHTS = { small: 8, medium: 16, large: 32 } as const;

/** Vertical space of a fixed height, besides the gap below every block. */
export const spacer = builtInEmailBlockOf(
  {
    type: 'spacer',
    label: 'Spacer',
    description: 'Empty space between two blocks',
    keywords: ['space', 'gap', 'padding'],
    fields: {},
    attributes: { height: choice(['small', 'medium', 'large'], 'medium', { label: 'Height' }) },
    render: ({ attributes }, h) => h.spacer({ height: HEIGHTS[attributes.height] }),
    sample: { fields: {}, attributes: { height: 'large' }, variableTypes: {} },
  },
  'spacer',
);
