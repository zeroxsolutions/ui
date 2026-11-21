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
  { name: 'first_name', type: 'string', label: 'First name', sampleValue: 'Lan' },
  { name: 'destination', type: 'string', label: 'Destination', sampleValue: 'Hoi An' },
  {
    name: 'trip_url',
    type: 'url',
    label: 'Trip link',
    sampleValue: 'https://trip-vietnam.com/trips/hoi-an',
    required: true,
  },
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
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="48"><rect width="240" height="48" rx="8" fill="#007A55"/><text x="120" y="31" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#ECFDF5" text-anchor="middle">Trip Vietnam</text></svg>',
  );

const previewInput: EmailPreviewInput = {
  subject: 'Your trip to {{destination}} starts soon',
  preheader: null,
  locale: 'en',
  layoutProps: {
    logo: { url: logo, alt: 'Trip Vietnam', width: 120 },
    footer: ['Trip Vietnam'],
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
  text('greeting', 'Hi {{first_name}}, **{{destination}}** is only a few days away.'),
  {
    id: 'open',
    key: 'open',
    type: 'button',
    attributes: { align: 'center' },
    content: { label: 'Open your trip', href: '{{trip_url}}' },
  },
  {
    id: 'tip',
    key: 'tip',
    type: 'callout',
    attributes: {},
    content: { text: 'Carry a copy of your passport and your hotel address.' },
  },
  {
    id: 'lanes',
    key: 'lanes',
    type: 'columns',
    attributes: { ratio: [1, 1] },
    content: {},
    lanes: [
      [text('before', '**Before you go**: check the weather and the exchange rate.')],
      [text('after', '**Once there**: save the places you like for the next trip.')],
    ],
  },
];

/** The email as the editor states it, and the email a renderer prints from it, drawn as the reader will see it. */
function EmailEditorDemo(): ReactNode {
  const [blocks, setBlocks] = useState(initial);
  const renderer = useMemo(() => createEmailRenderer({ theme }), []);
  return (
    <div className="w-full max-w-3xl">
      <EmailEditor
        profile={profile}
        value={blocks}
        onChange={setBlocks}
        renderer={renderer}
        previewInput={previewInput}
      />
    </div>
  );
}

export { EmailEditorDemo };
