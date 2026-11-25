import { link, number, plainText } from '../../template/email/fields.js';
import { defineLibraryBlock } from '../define-block.js';

/** The largest size a file block records, in bytes. */
export const FILE_SIZE_MAX = 2 ** 31;

const UNITS = ['B', 'KB', 'MB', 'GB'] as const;

/**
 * `bytes` as a reader reads a size, in the largest unit it fills, with one decimal under ten (`1.5 MB`, `12 KB`);
 * an empty string for 0, which a file block stores when the size is not known.
 */
export function fileSizeText(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const shown = unit === 0 || value >= 10 ? String(Math.round(value)) : value.toFixed(1).replace(/\.0$/, '');
  return `${shown} ${UNITS[unit]}`;
}

/** A file to download: its name, its size and a link to it. */
export const file = defineLibraryBlock({
  type: 'file',
  label: 'File',
  description: 'A file to download',
  keywords: ['attachment', 'download', 'upload', 'document'],
  fields: {
    name: plainText({ required: true }),
    href: link({ label: 'Link', required: true }),
  },
  attributes: {
    size: number({ min: 0, max: FILE_SIZE_MAX, default: 0, label: 'Size' }),
  },
  document: {
    html: ({ fields, attributes }, markup) =>
      markup`<a href="${markup.url(fields.href)}" download data-file><span data-file-name>${fields.name === '' ? fields.href : fields.name}</span>${
        attributes.size === 0 ? '' : markup`<span data-file-size>${fileSizeText(attributes.size)}</span>`
      }</a>`,
  },
});
