import { builtInEmailBlockOf } from '../define-email-block.js';
import { printInlineMarkup } from '../../markup/inline-markup.js';
import { link, plainText, richText } from '../fields.js';

/** The label the unsubscribe link takes where the block names none. */
const UNSUBSCRIBE_LABEL = 'Unsubscribe';

/**
 * The text a mail sent to a list must carry: why the reader gets it, the sender's postal address and a link that
 * unsubscribes them. The address and the link are required, so a mail built from it is never missing either.
 */
export const legalFooter = builtInEmailBlockOf(
  {
    type: 'legalFooter',
    label: 'Legal footer',
    description: 'Why the reader gets this, the address and an unsubscribe link',
    keywords: ['footer', 'unsubscribe', 'address', 'legal'],
    fields: {
      text: richText({ label: 'Text', max: 1000 }),
      address: plainText({ required: true, max: 300, label: 'Postal address' }),
      unsubscribe: link({ required: true, label: 'Unsubscribe link' }),
      unsubscribeLabel: plainText({ max: 100, label: 'Unsubscribe label' }),
    },
    render: ({ fields }, h) => {
      const label = fields.unsubscribeLabel.trim() === '' ? UNSUBSCRIBE_LABEL : fields.unsubscribeLabel;
      return h.section({ class: 'zx-legal' }, [
        h.text({ class: ['zx-legal-text', 'zx-tone-muted'], markup: fields.text }),
        h.text({ class: ['zx-legal-text', 'zx-tone-muted'], text: fields.address }),
        h.text({
          class: ['zx-legal-text', 'zx-tone-muted'],
          markup: printInlineMarkup([
            {
              kind: 'link',
              href: fields.unsubscribe,
              label: [{ kind: 'text', text: label, bold: false, italic: false }],
            },
          ]),
        }),
      ]);
    },
    sample: {
      fields: {
        text: 'You get this because you joined {{brand}}.',
        address: '1 Harbour Road, Bayside',
        unsubscribe: '{{unsubscribe_url}}',
        unsubscribeLabel: '',
      },
      variableTypes: { brand: 'string', unsubscribe_url: 'url' },
    },
  },
  'legalFooter',
);
