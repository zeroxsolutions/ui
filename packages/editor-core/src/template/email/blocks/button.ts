import { z } from 'zod';
import { defineBlockType } from '../block.js';
import { align, BUTTON_HREF_MAX_LENGTH, BUTTON_LABEL_MAX_LENGTH, readOr, spaceAfter } from './shared.js';

const attributes = z.object({ align, spaceAfter, width: z.enum(['inline', 'full']).optional() }).strict();
const content = z
  .object({
    label: z.string().min(1).max(BUTTON_LABEL_MAX_LENGTH),
    href: z.string().min(1).max(BUTTON_HREF_MAX_LENGTH),
  })
  .strict();
const lenientContent = z.object({ label: z.string().catch(''), href: z.string().catch('') });

/** A label and a link; the link opens with a literal scheme or a url variable, and may hold any token after it. */
export const button = defineBlockType({
  type: 'button',
  attributes,
  content,
  readAttributes: (raw) => readOr(attributes, raw, {}),
  readContent: (raw) => readOr(lenientContent, raw, { label: '', href: '' }),
  holdsText: true,
  holdsLanes: false,
  async translate(source, translateOne) {
    return { label: await translateOne(source.label), href: source.href };
  },
  render({ attributes: a, content: c }, { h }) {
    return h.button({ class: `zx-width-${a.width ?? 'inline'}`, href: c.href, label: c.label });
  },
  sample: {
    attributes: {},
    content: { label: 'Verify email', href: '{{verify_url}}' },
    variableTypes: { verify_url: 'url' },
  },
});
