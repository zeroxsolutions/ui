import { z } from 'zod';
import { SECTION_BACKGROUNDS, SPACES, type LayoutSpace, type SectionWidth } from '../../layout/index.js';
import { defineBlockType } from '../block.js';
import { readOr, spaceAfter, spaceBefore } from './shared.js';

/** The section widths an email draws: within the card's content, or to the card's inner edges; never past the card. */
export const EMAIL_SECTION_WIDTHS = ['content', 'wide'] as const satisfies readonly SectionWidth[];

/** Each padding token's length in px, on every side of a section's lane. */
export const SECTION_PADDING_PX = { none: 0, small: 8, medium: 16, large: 24 } as const satisfies Record<
  LayoutSpace,
  number
>;

/** The padding a section takes when it names none. */
export const DEFAULT_SECTION_PADDING: LayoutSpace = 'medium';

const background = z.enum(SECTION_BACKGROUNDS).optional();
const padding = z.enum(SPACES).optional();
const width = z.enum(EMAIL_SECTION_WIDTHS).optional();

const attributes = z.object({ background, padding, width, spaceBefore, spaceAfter }).strict();
const lenientAttributes = z.object({
  background: background.catch(undefined),
  padding: padding.catch(undefined),
  width: width.catch(undefined),
  spaceBefore: spaceBefore.catch(undefined),
  spaceAfter: spaceAfter.catch(undefined),
});

/**
 * A run of blocks on a background, in its own row of the body: the unit a page is built of. It holds one lane of
 * any block but a section, and sits at the top only.
 */
export const section = defineBlockType({
  type: 'section',
  attributes,
  content: z.object({}).strict(),
  readAttributes: (raw) => readOr(lenientAttributes, raw, {}),
  readContent: () => ({}),
  holdsText: false,
  holdsLanes: true,
  laneBounds: { min: 1, max: 1 },
  section: true,
  async translate(source) {
    return { ...source };
  },
  render({ attributes: a }, { h, lane }) {
    const background = a.background === undefined || a.background === 'none' ? null : `zx-section-bg-${a.background}`;
    return h.section(
      { class: ['zx-section', background, `zx-section-pad-${a.padding ?? DEFAULT_SECTION_PADDING}`] },
      lane(0),
    );
  },
  sample: {
    attributes: { background: 'muted', padding: 'medium' },
    content: {},
    variableTypes: { name: 'string' },
    lanes: [[{ id: 'sample-inside', type: 'paragraph', attributes: {}, content: { text: 'Inside for {{name}}' } }]],
  },
});
