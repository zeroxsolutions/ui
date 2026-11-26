'use client';

import { useMemo, useState, type ReactNode } from 'react';

import { emailProfile, type EditorEmailBlock } from '@zeroxsolutions/editor-core/profiles/index';
import { createEmailRenderer, type EmailTheme } from '@zeroxsolutions/editor-core/template/email/index';

import { EmailEditor, type EmailPreviewInput } from '@/registry/bases/base-ui/editor/profiles/email/email-editor';

const profile = emailProfile({ variables: [] });

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

// Inline, so the preview, a sandboxed frame with no origin, requests nothing.
const logo =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="48"><rect width="240" height="48" rx="8" fill="#007A55"/><text x="120" y="31" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#ECFDF5" text-anchor="middle">ZUI</text></svg>',
  );

const previewInput: EmailPreviewInput = {
  subject: 'A laid out email',
  preheader: null,
  locale: 'en',
  layoutProps: { logo: { url: logo, alt: 'ZUI', width: 120 }, footer: ['ZUI'] },
};

const paragraph = (id: string, text: string, attributes: EditorEmailBlock['attributes'] = {}): EditorEmailBlock => ({
  id,
  key: id,
  type: 'paragraph',
  attributes,
  content: { text },
});

// A hosted PNG: a mail client loads only an https image.
const SHARE = 'https://ui.zeroxsolutions.com/og/docs/editor';

const initial: EditorEmailBlock[] = [
  paragraph('intro', 'Select the image to align it or drag its sides; it never grows past the card.'),
  {
    id: 'picture',
    key: 'picture',
    type: 'image',
    attributes: { align: 'center', width: 0.5 },
    content: { src: `${SHARE}/email-editor/image.png`, alt: 'The Email Editor share card' },
  },
  {
    id: 'lanes',
    key: 'lanes',
    type: 'columns',
    attributes: { ratio: [8, 4], valign: 'center' },
    content: {},
    lanes: [
      [paragraph('wide', '**Two thirds**: drag the line between the columns to weigh them.')],
      [paragraph('narrow', 'One third.')],
    ],
  },
  {
    id: 'band',
    key: 'band',
    type: 'section',
    attributes: { background: 'muted', padding: 'large', width: 'wide' },
    content: {},
    lanes: [
      [
        { id: 'title', key: 'title', type: 'heading', attributes: { level: 2 }, content: { text: 'A wide section' } },
        paragraph('inside', "It reaches the card's inner edges, and holds the blocks set on its background."),
      ],
    ],
  },
];

/** An email laid out in the email editor: a resized image, weighed columns and a wide section, and its preview. */
function EditorLayoutEmailDemo(): ReactNode {
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

export { EditorLayoutEmailDemo };
