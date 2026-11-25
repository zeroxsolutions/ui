import { builtInEmailBlockOf } from '../define-email-block.js';
import { choice, imageUrl, items, link, plainText } from '../fields.js';

/** The most links one row holds, so it stays on one line on a phone. */
export const SOCIAL_LINKS_MAX = 8;
/** Each icon's side in px; the product supplies a hosted PNG at twice the size. */
export const SOCIAL_ICON_SIZES = { small: 24, medium: 32 } as const;

/**
 * A row of icon links to the product's pages elsewhere. The product supplies each icon, a hosted image; its
 * label is the icon's alt text, read where images are off, and the text arm's line.
 */
export const socialLinks = builtInEmailBlockOf(
  {
    type: 'socialLinks',
    label: 'Social links',
    description: 'A row of icon links',
    keywords: ['social', 'icons', 'follow'],
    fields: {
      links: items({
        label: 'Links',
        fields: {
          label: plainText({ required: true, max: 100, label: 'Label' }),
          icon: imageUrl({ required: true, label: 'Icon' }),
          href: link({ required: true, label: 'Link' }),
        },
        min: 1,
        max: SOCIAL_LINKS_MAX,
      }),
    },
    attributes: {
      align: choice(['left', 'center', 'right'], 'left', { label: 'Align' }),
      size: choice(['small', 'medium'], 'medium', { label: 'Size' }),
    },
    render: ({ fields, attributes }, h) =>
      h.icons({
        align: attributes.align,
        size: SOCIAL_ICON_SIZES[attributes.size],
        items: fields.links.map((entry) => ({ src: entry.icon, alt: entry.label, href: entry.href })),
      }),
    sample: {
      fields: {
        links: [
          { label: '{{brand}} on Instagram', icon: 'https://example.com/instagram.png', href: '{{profile_url}}' },
        ],
      },
      variableTypes: { brand: 'string', profile_url: 'url' },
    },
  },
  'socialLinks',
  { secureImages: true },
);
