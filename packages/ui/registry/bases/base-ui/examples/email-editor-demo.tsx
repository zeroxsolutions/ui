'use client';

import { useMemo, useState, type ReactNode } from 'react';

import {
  emailProfile,
  type EditorEmailBlock,
  type VariableDeclaration,
} from '@zeroxsolutions/editor-core/profiles/index';
import {
  choice,
  createEmailRenderer,
  defineEmailBlock,
  plainText,
  richText,
  type EmailTheme,
} from '@zeroxsolutions/editor-core/template/email/index';

import { simulatedUpload } from '@/registry/bases/base-ui/editor/document/uploads';
import { EmailEditor, type EmailPreviewInput } from '@/registry/bases/base-ui/editor/profiles/email/email-editor';

const variables: VariableDeclaration[] = [
  { name: 'first_name', type: 'string', label: 'first name', sampleValue: 'Lan' },
  { name: 'plan', type: 'string', label: 'plan', sampleValue: 'Team' },
  {
    name: 'account_url',
    type: 'url',
    label: 'account link',
    sampleValue: 'https://example.com/account',
    required: true,
  },
  { name: 'guide_url', type: 'url', label: 'guide link', sampleValue: 'https://example.com/guide' },
  {
    name: 'unsubscribe_url',
    type: 'url',
    label: 'unsubscribe link',
    sampleValue: 'https://example.com/unsubscribe',
    required: true,
  },
];

const theme: EmailTheme = {
  colors: {
    background: '#FFFFFF',
    foreground: '#09090B',
    primary: '#007A55',
    primaryForeground: '#ECFDF5',
    muted: '#F4F4F5',
    mutedForeground: '#63636D',
    border: '#E4E4E7',
  },
  dark: {
    background: '#0A0A0A',
    foreground: '#FAFAFA',
    primary: '#00BC7D',
    primaryForeground: '#022C22',
    muted: '#262626',
    mutedForeground: '#A1A1A1',
    border: '#262626',
  },
  radius: 10,
  font: { family: 'Inter', fallback: 'Arial, Helvetica, sans-serif' },
};

/** A testimonial of your own: its body is written in place, its author in a field under it, its tone in the block menu. */
const testimonial = defineEmailBlock({
  type: 'testimonial',
  label: 'Testimonial',
  description: 'A line a customer said',
  keywords: ['quote', 'review'],
  fields: { text: richText(), author: plainText({ max: 120 }) },
  attributes: { tone: choice(['neutral', 'brand'], 'neutral') },
  render: ({ fields, attributes }, h) =>
    h.section({ class: ['zx-testimonial', `zx-testimonial-${attributes.tone}`] }, [
      h.text({ markup: fields.text }),
      h.text({ class: ['zx-tone-muted', 'zx-testimonial-author'], text: fields.author }),
    ]),
  sample: {
    fields: { text: '{{first_name}} set us up in a day.', author: 'Lan' },
    variableTypes: { first_name: 'string' },
  },
});

// The testimonial joins the profile, so a server's `validate` reads it as the editor does.
const profile = emailProfile({ variables, blocks: [testimonial] });

// Sends nothing: it fills the progress over two seconds, then answers a picture the site already serves.
const upload = simulatedUpload({
  address: () => 'https://ui.zeroxsolutions.com/og/docs/editor/email-editor/image.png',
});

// The testimonial's own rules, and the callout's border in the brand's green; a color for dark mode goes in its own
// query, since the base sheet's dark rules beat an inlined one.
const css = `
.zx-testimonial { border-left: 3px solid #E4E4E7; padding: 0 0 0 16px; }
.zx-testimonial-brand { border-left-color: #007A55; }
.zx-testimonial-author { font-size: 13px; }
.zx-callout { border-color: #007A55; }
@media (prefers-color-scheme: dark) {
  .zx-testimonial { border-left-color: #262626; }
  .zx-testimonial-brand, .zx-callout { border-color: #00BC7D; }
}
`;

// Inline, so the preview, a sandboxed frame with no origin, requests nothing; a sent mail takes the hosted PNG
// that DefaultLayoutProps asks for, since mail clients render no SVG.
const logo =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="48"><rect width="240" height="48" rx="8" fill="#007A55"/><text x="120" y="31" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#ECFDF5" text-anchor="middle">ZUI</text></svg>',
  );

const previewInput: EmailPreviewInput = {
  subject: 'Your {{plan}} plan is ready',
  preheader: 'Open your account and invite your team.',
  locale: 'en',
  layoutProps: {
    logo: { url: logo, alt: 'ZUI', width: 120 },
    footer: ['ZUI'],
  },
};

const text = (id: string, content: string): EditorEmailBlock => ({
  id,
  key: id,
  type: 'paragraph',
  attributes: {},
  content: { text: content },
});

// The hero's and the card's images are the docs' own share cards, and the social icons Fluent Emoji's PNGs: a mail
// client loads only a hosted https image, and Outlook draws no WebP.
const SHARE = 'https://ui.zeroxsolutions.com/og/docs/editor';
const EMOJI = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets';

const initial: EditorEmailBlock[] = [
  {
    id: 'hero',
    key: 'hero',
    type: 'hero',
    attributes: { align: 'left' },
    content: {
      image: `${SHARE}/email-editor/image.png`,
      alt: 'ZUI',
      heading: 'Welcome to ZUI, {{first_name}}',
      text: 'Everything your team needs to write and send mail, in one place.',
      buttonLabel: '',
      buttonHref: '',
    },
  },
  text('greeting', 'Hi {{first_name}}, your **{{plan}}** plan is ready.'),
  {
    id: 'open',
    key: 'open',
    type: 'button',
    attributes: { align: 'center' },
    content: { label: 'Open your account', href: '{{account_url}}' },
  },
  {
    id: 'note',
    key: 'note',
    type: 'callout',
    attributes: {},
    content: { text: 'Your first invoice is sent on the first day of next month.' },
  },
  {
    id: 'said',
    key: 'said',
    type: 'testimonial',
    attributes: { tone: 'brand' },
    content: { text: 'We moved our whole team over in **one afternoon**.', author: 'Minh, at Example' },
  },
  {
    id: 'lanes',
    key: 'lanes',
    type: 'columns',
    attributes: { ratio: [1, 1] },
    content: {},
    lanes: [
      [text('invite', '**Invite your team**: add people from the members page.')],
      [text('help', '**Need help?** Read the [getting started guide]({{guide_url}}).')],
    ],
  },
  {
    id: 'guide',
    key: 'guide',
    type: 'card',
    attributes: {},
    content: {
      image: `${SHARE}/document-editor/image.png`,
      alt: 'The Document Editor',
      heading: 'Write your first document',
      text: 'Headings, tables and callouts, with a Viewer that draws them the same way.',
      buttonLabel: 'Read the guide',
      buttonHref: '{{guide_url}}',
    },
  },
  { id: 'gap', key: 'gap', type: 'spacer', attributes: { height: 'medium' }, content: {} },
  {
    id: 'social',
    key: 'social',
    type: 'socialLinks',
    attributes: { align: 'center', size: 'small' },
    content: {
      links: [
        {
          label: 'Website',
          icon: `${EMOJI}/Globe%20with%20meridians/3D/globe_with_meridians_3d.png`,
          href: 'https://example.com',
        },
        {
          label: 'Community',
          icon: `${EMOJI}/Speech%20balloon/3D/speech_balloon_3d.png`,
          href: 'https://example.com/community',
        },
        { label: 'Email us', icon: `${EMOJI}/Envelope/3D/envelope_3d.png`, href: 'mailto:hello@example.com' },
      ],
    },
  },
  {
    id: 'legal',
    key: 'legal',
    type: 'legalFooter',
    attributes: {},
    content: {
      sender: 'ZUI sends this to {{first_name}}.',
      reason: 'You get it because you made a ZUI account.',
      address: '1 Harbour Road, Bayside',
      unsubscribe: '{{unsubscribe_url}}',
      unsubscribeLabel: '',
    },
  },
];

/**
 * A welcome email opening on a hero, with a button and a text link to url variables, a callout, a testimonial block
 * of its own, two columns, a card, social links and the legal footer, and its preview, styled by a stylesheet of its
 * own over the theme.
 */
function EmailEditorDemo(): ReactNode {
  const [blocks, setBlocks] = useState(initial);
  const renderer = useMemo(() => createEmailRenderer({ theme, css, extraBlocks: [testimonial] }), []);
  return (
    <EmailEditor
      label="Email body"
      profile={profile}
      blocks={[testimonial]}
      value={blocks}
      onChange={setBlocks}
      upload={upload}
      renderer={renderer}
      previewInput={previewInput}
      sender="ZUI"
      className="max-w-2xl"
    />
  );
}

export { EmailEditorDemo };
