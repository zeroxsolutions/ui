import { builtInEmailBlockOf, type EmailBlockView } from '../define-email-block.js';
import { choice, imageUrl, link, plainText, richText } from '../fields.js';
import type { EmailNode, EmailPrimitives } from '../primitives/nodes.js';
import { BUTTON_LABEL_MAX_LENGTH, CONTENT_WIDTH } from './shared.js';

/** The longest alt text and heading a hero and a card take. */
const SHORT_TEXT_MAX_LENGTH = 200;

/** The fields a hero and a card both hold: an image and its alt, a heading, text, and an optional button. */
export const FEATURE_FIELDS = {
  image: imageUrl({ required: true, label: 'Image' }),
  alt: plainText({ required: true, max: SHORT_TEXT_MAX_LENGTH, label: 'Alt text' }),
  heading: plainText({ required: true, max: SHORT_TEXT_MAX_LENGTH, label: 'Heading' }),
  text: richText({ label: 'Text' }),
  buttonLabel: plainText({ max: BUTTON_LABEL_MAX_LENGTH, label: 'Button label' }),
  buttonHref: link({ label: 'Button link' }),
} as const;

/** The button's label and link, which are filled together or both left empty. */
export const BUTTON_PAIR = [['buttonLabel', 'buttonHref']] as const;

/** Sample fields for a hero or a card, naming a variable in the heading. */
export const FEATURE_SAMPLE = {
  image: 'https://example.com/hero.png',
  alt: 'The bay at dawn',
  heading: 'Welcome to {{place}}',
  text: 'Your stay starts **tomorrow**.',
  buttonLabel: 'See your trip',
  buttonHref: '{{trip_url}}',
} as const;

/**
 * A hero's or a card's content under `prefix`: the image `width` px wide, the heading at `level`, the text, and the
 * button where both its label and its link are filled.
 */
export function featureNodes(
  { fields }: Pick<EmailBlockView<typeof FEATURE_FIELDS, Record<never, never>>, 'fields'>,
  h: EmailPrimitives,
  options: { readonly prefix: string; readonly width: number; readonly level: 1 | 2 },
): EmailNode[] {
  const { prefix, width, level } = options;
  const withButton = fields.buttonLabel.trim() !== '' && fields.buttonHref.trim() !== '';
  return [
    h.image({ class: ['zx-image-fluid', `${prefix}-image`], src: fields.image, alt: fields.alt, width }),
    h.heading({ class: `${prefix}-heading`, level, text: fields.heading }),
    h.text({ class: `${prefix}-text`, markup: fields.text }),
    ...(withButton
      ? [h.section({ class: `${prefix}-action` }, [h.button({ href: fields.buttonHref, label: fields.buttonLabel })])]
      : []),
  ];
}

/** A wide image, a large heading, text and a button: the opening of a campaign mail. */
export const hero = builtInEmailBlockOf(
  {
    type: 'hero',
    label: 'Hero',
    description: 'A wide image, a heading, text and a button',
    keywords: ['banner', 'header', 'masthead'],
    fields: FEATURE_FIELDS,
    attributes: { align: choice(['left', 'center'], 'left', { label: 'Align' }) },
    render: (view, h) => featureNodes(view, h, { prefix: 'zx-hero', width: CONTENT_WIDTH, level: 1 }),
    sample: {
      fields: FEATURE_SAMPLE,
      attributes: { align: 'center' },
      variableTypes: { place: 'string', trip_url: 'url' },
    },
  },
  'hero',
  { pairs: BUTTON_PAIR, secureImages: true, wide: true },
);
