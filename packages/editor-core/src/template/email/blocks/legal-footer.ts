import { printInlineMarkup } from '../../markup/inline-markup.js';
import { builtInEmailBlockOf } from '../define-email-block.js';
import { link, plainText, richText } from '../fields.js';

/** The label the unsubscribe link takes where the block names none. */
const UNSUBSCRIBE_LABEL = 'Unsubscribe';

/**
 * The text a mail sent to a list must carry: who sends it, why the reader gets it, the sender's postal address and
 * a link that unsubscribes them. The address and the link are required, so a mail built from it is never missing
 * either. `unsubscribeLabel` words the link in the mail's language.
 */
export const legalFooter = builtInEmailBlockOf(
  {
    type: 'legalFooter',
    label: 'Legal footer',
    description: 'Who sends this and why, the address and an unsubscribe link',
    keywords: ['footer', 'unsubscribe', 'address', 'legal'],
    fields: {
      sender: richText({ label: 'Sender', max: 1000 }),
      reason: plainText({ max: 500, label: 'Why the reader gets this' }),
      address: plainText({ required: true, max: 300, label: 'Postal address' }),
      unsubscribe: link({ required: true, label: 'Unsubscribe link' }),
      unsubscribeLabel: plainText({ max: 100, label: 'Unsubscribe label' }),
    },
    render: ({ fields }, h) => {
      const label = fields.unsubscribeLabel.trim() === '' ? UNSUBSCRIBE_LABEL : fields.unsubscribeLabel;
      const line = (text: string) => h.text({ class: ['zx-legal-text', 'zx-tone-muted'], text });
      return h.section({ class: 'zx-legal' }, [
        h.text({ class: ['zx-legal-text', 'zx-tone-muted'], markup: fields.sender }),
        ...(fields.reason.trim() === '' ? [] : [line(fields.reason)]),
        line(fields.address),
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
        sender: '{{brand}} sends this.',
        reason: 'You joined our list.',
        address: '1 Harbour Road, Bayside',
        unsubscribe: '{{unsubscribe_url}}',
        unsubscribeLabel: '',
      },
      variableTypes: { brand: 'string', unsubscribe_url: 'url' },
    },
  },
  'legalFooter',
);
