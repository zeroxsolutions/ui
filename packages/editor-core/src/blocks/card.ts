import { CARD_OPTIONS } from '../template/email/blocks/card.js';
import { BUTTON_PAIR } from '../template/email/blocks/hero.js';
import { defineLibraryBlock } from './define-block.js';

/** An address a reader's browser opens as a page or a mail, the only one the card's button links to. */
const OPENED = /^(?:https?:|mailto:)/i;

/**
 * The library's card for both editors: in an email the renderer's own `card`, and in a document a figure of its
 * image over its heading, text and button. The button is written only with a label and a link a reader opens, as
 * the email draws it only with both.
 */
export const card = defineLibraryBlock(
  {
    type: CARD_OPTIONS.type,
    label: CARD_OPTIONS.label,
    description: CARD_OPTIONS.description,
    keywords: CARD_OPTIONS.keywords,
    fields: CARD_OPTIONS.fields,
    email: { render: CARD_OPTIONS.render, sample: CARD_OPTIONS.sample },
    document: {
      html: ({ fields, body }, markup) =>
        markup`<figure data-card><img src="${markup.url(fields.image)}" alt="${fields.alt}"><figcaption><strong>${fields.heading}</strong>${body}${
          fields.buttonLabel.trim() === '' || !OPENED.test(fields.buttonHref.trim())
            ? ''
            : markup`<a href="${markup.url(fields.buttonHref)}">${fields.buttonLabel}</a>`
        }</figcaption></figure>`,
    },
  },
  { pairs: BUTTON_PAIR, secureImages: true, wide: true },
);
