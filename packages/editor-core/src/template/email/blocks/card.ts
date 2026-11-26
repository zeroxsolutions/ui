import { builtInEmailBlockOf } from '../define-email-block.js';
import { BUTTON_PAIR, FEATURE_FIELDS, FEATURE_SAMPLE, featureNodes } from './hero.js';
/** The card's 1px border at each side, which its image sits inside. */
const CARD_BORDERS = 2;

/** The card's definition as both editors read it; `defineBlock`'s card is built from it. */
export const CARD_OPTIONS = {
  type: 'card',
  label: 'Card',
  description: 'An image, a heading, text and a button in a frame',
  keywords: ['feature', 'product', 'tile'],
  fields: FEATURE_FIELDS,
  render: (view, h, { available }) => {
    const width = available - CARD_BORDERS;
    const [image, ...body] = featureNodes(view, h, { prefix: 'zx-card-block', width, level: 2 });
    return h.section({ class: 'zx-card-block' }, [image!, h.section({ class: 'zx-card-block-body' }, body)]);
  },
  sample: { fields: FEATURE_SAMPLE, variableTypes: { place: 'string', trip_url: 'url' } },
} satisfies Parameters<typeof builtInEmailBlockOf<'card', typeof FEATURE_FIELDS, Record<never, never>>>[0];

/** A framed feature: an image across its top, then a heading, text and a button. */
export const card = builtInEmailBlockOf(CARD_OPTIONS, 'card', { pairs: BUTTON_PAIR, secureImages: true, wide: true });
