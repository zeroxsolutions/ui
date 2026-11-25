import { choice, imageUrl, link, plainText } from '../../template/email/fields.js';
import { defineLibraryBlock } from '../define-block.js';

/** A video or a sound played in place, with its controls, and a caption under it. */
export const media = defineLibraryBlock({
  type: 'media',
  label: 'Video',
  description: 'A video or audio player',
  keywords: ['video', 'audio', 'sound', 'movie', 'player'],
  fields: {
    src: link({ label: 'Source', required: true }),
    caption: plainText(),
    poster: imageUrl({ label: 'Poster' }),
  },
  attributes: {
    kind: choice(['video', 'audio'], 'video', { valueLabels: { video: 'Video', audio: 'Audio' } }),
  },
  document: {
    html: ({ fields, attributes }, markup) =>
      markup`<figure data-media="${attributes.kind}">${
        attributes.kind === 'audio'
          ? markup`<audio controls src="${markup.url(fields.src)}"></audio>`
          : fields.poster === ''
            ? markup`<video controls src="${markup.url(fields.src)}"></video>`
            : markup`<video controls src="${markup.url(fields.src)}" poster="${markup.url(fields.poster)}"></video>`
      }${fields.caption === '' ? '' : markup`<figcaption>${fields.caption}</figcaption>`}</figure>`,
  },
});
