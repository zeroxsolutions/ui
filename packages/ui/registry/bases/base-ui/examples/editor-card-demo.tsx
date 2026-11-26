'use client';

import { useState, type ReactNode } from 'react';

import type { IEditor, DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';

import { card as cardBlock } from '@zeroxsolutions/editor-core/blocks/index';
import { card } from '@/registry/bases/base-ui/editor/document/features/card';
import { standardKit } from '@/registry/bases/base-ui/editor/document/features/standard';
import { simulatedUpload } from '@/registry/bases/base-ui/editor/document/uploads';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';
import { BubbleMenu } from '@/registry/bases/base-ui/editor/document/ui/bubble-menu';
import { EditorToolbar } from '@/registry/bases/base-ui/editor/document/ui/editor-toolbar';
import { SlashMenu } from '@/registry/bases/base-ui/editor/document/ui/slash-menu';

// Sends nothing: it fills the progress over two seconds, then answers a picture the site already serves.
const upload = simulatedUpload({
  address: () => 'https://ui.zeroxsolutions.com/og/docs/editor/email-editor/image.png',
});

const features = [standardKit(), card(cardBlock, { upload })];
const contributions = collectUiContributions(features);

function paragraph(text: string): NodeJSON {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

const content: DocJSON = {
  type: 'doc',
  content: [
    paragraph('Write in the card to change its title, text and button.'),
    {
      type: 'card',
      attrs: {
        image: 'https://ui.zeroxsolutions.com/og/docs/editor/document-editor/image.png',
        alt: 'The Document Editor share card',
        heading: 'Document Editor',
        buttonLabel: 'Read the guide',
        buttonHref: 'https://ui.zeroxsolutions.com/docs/editor/document-editor',
      },
      content: [
        { type: 'text', text: 'Write with headings, lists, tables and callouts, then read it back in the Viewer.' },
      ],
    },
  ],
};

/** A document with a card for a guide. */
function EditorCardDemo(): ReactNode {
  const [editor, setEditor] = useState<IEditor | null>(null);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setRoot} className="flex w-full max-w-2xl flex-col gap-3">
      {editor && <EditorToolbar editor={editor} items={contributions.toolbar} className="self-start" />}
      <Editor features={features} content={content} onReady={setEditor} />
      {editor && <SlashMenu editor={editor} items={contributions.slash} />}
      {editor && <BubbleMenu editor={editor} items={contributions.bubble} container={root} />}
    </div>
  );
}

export { EditorCardDemo };
