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
  subject: 'Styled text',
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

const initial: EditorEmailBlock[] = [
  {
    id: 'title',
    key: 'title',
    type: 'heading',
    attributes: { level: 2, align: 'center' },
    content: { text: 'A centred heading' },
  },
  paragraph('lead', 'A lead paragraph, larger than the text around it.', { align: 'center', size: 'lead' }),
  paragraph(
    'colours',
    'Select words to colour them: {color=red}red{/color}, {color=teal}teal{/color} or {bg=amber}on amber{/bg}. Each takes its light and dark value from the theme.',
  ),
  paragraph('small', 'A small line, at the end of the line.', { align: 'right', size: 'small' }),
];

/** Text in the email editor: aligned lines, lead and small paragraphs, and text and background colours. */
function EmailEditorTextStylingDemo(): ReactNode {
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

export { EmailEditorTextStylingDemo };
