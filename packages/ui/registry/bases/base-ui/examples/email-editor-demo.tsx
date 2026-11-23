'use client';

import { useMemo, useState, type ReactNode } from 'react';

import {
  emailProfile,
  type EditorEmailBlock,
  type VariableDeclaration,
} from '@zeroxsolutions/editor-core/profiles/index';
import { createEmailRenderer, type EmailTheme } from '@zeroxsolutions/editor-core/template/email/index';

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

const profile = emailProfile({ variables });

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
  radius: 10,
  font: { family: 'Inter', fallback: 'Arial, Helvetica, sans-serif' },
};

// Inline, so the preview, a sandboxed frame with no origin, requests nothing; a sent mail takes the hosted PNG
// that DefaultLayoutProps asks for, since mail clients render no SVG.
const logo =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="48"><rect width="240" height="48" rx="8" fill="#007A55"/><text x="120" y="31" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#ECFDF5" text-anchor="middle">ZUI</text></svg>',
  );

const previewInput: EmailPreviewInput = {
  subject: 'Your {{plan}} plan is ready',
  preheader: null,
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

/** A welcome email with a button and a text link to url variables, a callout and two columns, and its preview. */
function EmailEditorDemo(): ReactNode {
  const [blocks, setBlocks] = useState(initial);
  const renderer = useMemo(() => createEmailRenderer({ theme }), []);
  return (
    <EmailEditor
      label="Email body"
      profile={profile}
      value={blocks}
      onChange={setBlocks}
      renderer={renderer}
      previewInput={previewInput}
      className="max-w-2xl"
    />
  );
}

export { EmailEditorDemo };
