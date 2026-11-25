import { defineBlock } from '@zeroxsolutions/editor-core/blocks/index';
import { imageUrl, link, plainText, richText } from '@zeroxsolutions/editor-core/template/email/index';

/**
 * A stand-in for the card's shared definition, which the email side's `blocks/card.ts` declares with these
 * fields; the specs use it until that definition lands beside this feature.
 */
export const cardDefinition = defineBlock({
  type: 'card',
  label: 'Card',
  description: 'An image, a title, a text and a button',
  keywords: ['product', 'place', 'article'],
  fields: {
    image: imageUrl({ required: true }),
    alt: plainText({ required: true }),
    heading: plainText({ required: true }),
    text: richText(),
    buttonLabel: plainText(),
    buttonHref: link(),
  },
  document: {
    html: ({ fields, body }, markup) =>
      markup`<figure data-card><img src="${markup.url(fields.image)}" alt="${fields.alt}"><figcaption><strong>${fields.heading}</strong>${body}${
        fields.buttonLabel === '' ? '' : markup`<a href="${markup.url(fields.buttonHref)}">${fields.buttonLabel}</a>`
      }</figcaption></figure>`,
  },
});
