import { z } from 'zod';
import { defineBlockType } from '../block.js';
import {
  address,
  align,
  BUTTON_HREF_MAX_LENGTH,
  IMAGE_START,
  imageWidth,
  isLegacyPixelWidth,
  LINK_START,
  readOr,
  spaceAfter,
  spaceBefore,
} from './shared.js';

/** The longest alt text and caption: a sentence or two, never a body. */
export const IMAGE_TEXT_MAX_LENGTH = 500;

const attributes = z.object({ align, spaceBefore, spaceAfter, width: imageWidth.optional() }).strict();
const content = z
  .object({
    src: address(IMAGE_START, BUTTON_HREF_MAX_LENGTH),
    alt: z
      .string()
      .max(IMAGE_TEXT_MAX_LENGTH)
      .refine((value) => value.trim() !== '', { message: 'required' }),
    caption: z.string().max(IMAGE_TEXT_MAX_LENGTH).optional(),
    // An empty link is no link, as the editor stores one it never had.
    href: z.literal('').or(address(LINK_START, BUTTON_HREF_MAX_LENGTH)).optional(),
  })
  .strict();
const lenientAttributes = z.object({
  align: align.catch(undefined),
  spaceBefore: spaceBefore.catch(undefined),
  spaceAfter: spaceAfter.catch(undefined),
  width: imageWidth.optional().catch(undefined),
});
const lenientContent = z.object({
  src: z.string().catch(''),
  alt: z.string().catch(''),
  caption: z.string().catch(''),
  href: z.string().catch(''),
});

/**
 * The px an image is drawn at: a fraction of the width it sits in, a legacy pixel width as stored, or the whole of
 * that width when it names none; never wider than the width it sits in, since Outlook, which reads no `max-width`,
 * would push the lane or the card past its edge.
 */
function drawnWidth(width: number | undefined, available: number): number {
  if (width === undefined) return available;
  return Math.min(isLegacyPixelWidth(width) ? width : Math.round(width * available), available);
}

/**
 * A hosted image, its alt text read where images are off, optionally linked and captioned. It is drawn at its
 * width, at most the width it sits in and that by default, and shrinks to a narrow screen. The write check
 * takes an `https:` address or a url variable; drawn, any address but an `http:` or `https:` one draws nothing,
 * as for a product block's image, so a stored `http:` address or a variable filled with one still draws.
 */
export const image = defineBlockType({
  type: 'image',
  attributes,
  content,
  readAttributes: (raw) => readOr(lenientAttributes, raw, {}),
  readContent: (raw) => readOr(lenientContent, raw, { src: '', alt: '', caption: '', href: '' }),
  holdsText: true,
  holdsLanes: false,
  async translate(source, translateOne) {
    return {
      ...source,
      alt: await translateOne(source.alt),
      ...(source.caption === undefined || source.caption === '' ? {} : { caption: await translateOne(source.caption) }),
    };
  },
  render({ attributes: a, content: c }, { h, available }) {
    const caption = c.caption ?? '';
    return [
      h.image({
        class: 'zx-image-fluid',
        src: c.src,
        alt: c.alt,
        width: drawnWidth(a.width, available),
        ...(c.href ? { href: c.href } : {}),
      }),
      caption !== '' && h.text({ class: ['zx-caption', 'zx-tone-muted'], text: caption }),
    ].filter((node) => node !== false);
  },
  sample: {
    attributes: {},
    content: {
      src: 'https://example.com/banner.png',
      alt: 'The harbour at {{place}}',
      caption: 'Morning in {{place}}',
    },
    variableTypes: { place: 'string' },
  },
});
