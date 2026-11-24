import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { emailProfile, type EditorEmailBlock } from '@zeroxsolutions/editor-core/profiles/index';

import { EmailEditor } from './email-editor';

const blocks: EditorEmailBlock[] = [
  { id: 'p1', key: 'p1', type: 'paragraph', attributes: {}, content: { text: 'Hello there' } },
  {
    id: 'b1',
    key: 'b1',
    type: 'button',
    attributes: { align: 'center' },
    content: { label: 'Open your account', href: 'https://example.test' },
  },
];

describe('EmailEditor on the server', () => {
  // The engine mounts only after hydration; until then the page showed nothing where the document goes.
  it('draws the starting document, before the editor mounts', () => {
    const drawn = renderToString(<EmailEditor label="Body" profile={emailProfile({ variables: [] })} value={blocks} />);

    expect(drawn).toContain('Hello there');
    expect(drawn).toContain('Open your account');
  });
});
