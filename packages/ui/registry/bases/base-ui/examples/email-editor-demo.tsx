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

/** A quote of your own: its body is written in place, its author in a field under it, its tone in the block menu. */
const quote = defineEmailBlock({
  type: 'quote',
  label: 'Quote',
  description: 'A line a customer said',
  keywords: ['testimonial'],
  fields: { text: richText(), author: plainText({ max: 120 }) },
  attributes: { tone: choice(['neutral', 'brand'], 'neutral') },
  render: ({ fields, attributes }, h) =>
    h.section({ class: ['zx-quote', `zx-quote-${attributes.tone}`] }, [
      h.text({ markup: fields.text }),
      h.text({ class: ['zx-tone-muted', 'zx-quote-author'], text: fields.author }),
    ]),
  sample: {
    fields: { text: '{{first_name}} set us up in a day.', author: 'Lan' },
    variableTypes: { first_name: 'string' },
  },
});

// The quote joins the profile, so a server's `validate` reads it as the editor does.
const profile = emailProfile({ variables, blocks: [quote] });

// The quote's own rules, and the callout's border in the brand's green; a color for dark mode goes in its own
// query, since the base sheet's dark rules beat an inlined one.
const css = `
.zx-quote { border-left: 3px solid #E4E4E7; padding: 0 0 0 16px; }
.zx-quote-brand { border-left-color: #007A55; }
.zx-quote-author { font-size: 13px; }
.zx-callout { border-color: #007A55; }
@media (prefers-color-scheme: dark) {
  .zx-quote { border-left-color: #262626; }
  .zx-quote-brand, .zx-callout { border-color: #00BC7D; }
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

const initial: EditorEmailBlock[] = [
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
    type: 'quote',
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
];

/**
 * A welcome email with a button and a text link to url variables, a callout, a quote block of its own, two
 * columns, and its preview, styled by a stylesheet of its own over the theme.
 */
function EmailEditorDemo(): ReactNode {
  const [blocks, setBlocks] = useState(initial);
  const renderer = useMemo(() => createEmailRenderer({ theme, css, extraBlocks: [quote] }), []);
  return (
    <EmailEditor
      label="Email body"
      profile={profile}
      blocks={[quote]}
      value={blocks}
      onChange={setBlocks}
      renderer={renderer}
      previewInput={previewInput}
      sender="ZUI"
      className="max-w-2xl"
    />
  );
}

export { EmailEditorDemo };
