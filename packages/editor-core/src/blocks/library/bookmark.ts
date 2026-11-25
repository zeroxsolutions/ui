import { imageUrl, link, plainText } from '../../template/email/fields.js';
import { defineLibraryBlock } from '../define-block.js';

/**
 * A link drawn as a card: its title, its description and its image, which the host reads from the page when the
 * author pastes the address. Without a title the card shows the address.
 */
export const bookmark = defineLibraryBlock({
  type: 'bookmark',
  label: 'Bookmark',
  description: 'A link with its preview',
  keywords: ['link', 'preview', 'url', 'web'],
  fields: {
    url: link({ label: 'Link', required: true }),
    title: plainText(),
    description: plainText(),
    image: imageUrl(),
  },
  document: {
    html: ({ fields }, markup) =>
      markup`<a href="${markup.url(fields.url)}" data-bookmark><span data-bookmark-title>${fields.title === '' ? fields.url : fields.title}</span>${
        fields.description === '' ? '' : markup`<span data-bookmark-description>${fields.description}</span>`
      }<span data-bookmark-url>${fields.url}</span>${
        fields.image === '' ? '' : markup`<img src="${markup.url(fields.image)}" alt="">`
      }</a>`,
  },
});
