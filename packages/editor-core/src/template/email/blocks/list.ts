import { z } from 'zod';
import { defineBlock } from '../block.js';
import { align, inlineText, LIST_MAX_ITEMS, readOr, spaceAfter } from './shared.js';

const attributes = z.object({ align, spaceAfter }).strict();
const content = z.object({ items: z.array(inlineText).min(1).max(LIST_MAX_ITEMS) }).strict();
const lenientContent = z.object({ items: z.array(z.string()).catch([]) });

/** Short bullet lines. */
export const list = defineBlock({
  type: 'list',
  attributes,
  content,
  readAttributes: (raw) => readOr(attributes, raw, {}),
  readContent: (raw) => readOr(lenientContent, raw, { items: [] }),
  holdsText: true,
  holdsLanes: false,
  async translate(source, translateOne) {
    const items: string[] = [];
    // In order rather than at once: a provider limits translations per minute, and twenty parallel calls
    // from one list reach that limit before twenty sequential ones do.
    for (const item of source.items) items.push(await translateOne(item));
    return { items };
  },
  render({ content: c }, { h }) {
    return h.list({ items: c.items });
  },
  sample: { attributes: {}, content: { items: ['Day 1: {{place}}'] }, variableTypes: { place: 'string' } },
});
