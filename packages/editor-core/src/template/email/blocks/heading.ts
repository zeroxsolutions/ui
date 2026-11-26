import { z } from 'zod';
import { defineBlockType } from '../block.js';
import { align, inlineText, readOr, spaceAfter, spaceBefore } from './shared.js';

const LEVELS = [1, 2, 3] as const;
/** The level a heading is drawn at when it names none: a section's title under the subject. */
const DEFAULT_LEVEL = 2;

const level = z.union(LEVELS.map((value) => z.literal(value)) as [z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]);
const attributes = z.object({ level: level.optional(), align, spaceBefore, spaceAfter }).strict();
const content = z.object({ text: inlineText }).strict();
const lenientAttributes = z.object({
  level: level.optional().catch(undefined),
  align: align.catch(undefined),
  spaceBefore: spaceBefore.catch(undefined),
  spaceAfter: spaceAfter.catch(undefined),
});
const lenientContent = z.object({ text: z.string().catch('') });

/** A title over what follows, at level 1, 2 or 3. */
export const heading = defineBlockType({
  type: 'heading',
  attributes,
  content,
  readAttributes: (raw) => readOr(lenientAttributes, raw, {}),
  readContent: (raw) => readOr(lenientContent, raw, { text: '' }),
  holdsText: true,
  holdsLanes: false,
  async translate(source, translateOne) {
    return { text: await translateOne(source.text) };
  },
  render({ attributes: a, content: c }, { h }) {
    return h.heading({ level: a.level ?? DEFAULT_LEVEL, markup: c.text });
  },
  sample: { attributes: { level: 2 }, content: { text: 'Your trip to {{place}}' }, variableTypes: { place: 'string' } },
});
