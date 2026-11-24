import { CARD_OPTIONS } from '../template/email/blocks/card.js';
import { BUTTON_PAIR } from '../template/email/blocks/hero.js';
import { defineLibraryBlock } from './define-block.js';

/**
 * The library's card for both editors: in an email the renderer's own `card`, and in a document a figure of its
 * image over its heading, text and button. The button is written only with both its label and its link.
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
          fields.buttonLabel === '' || fields.buttonHref === ''
            ? ''
            : markup`<a href="${markup.url(fields.buttonHref)}">${fields.buttonLabel}</a>`
        }</figcaption></figure>`,
    },
  },
  BUTTON_PAIR,
);
