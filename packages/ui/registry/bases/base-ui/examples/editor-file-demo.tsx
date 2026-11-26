'use client';

import { useState, type ReactNode } from 'react';

import type { IEditor, DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';

import { file } from '@/registry/bases/base-ui/editor/document/features/file';
import { standardKit } from '@/registry/bases/base-ui/editor/document/features/standard';
import { simulatedUpload } from '@/registry/bases/base-ui/editor/document/uploads';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';
import { BubbleMenu } from '@/registry/bases/base-ui/editor/document/ui/bubble-menu';
import { EditorToolbar } from '@/registry/bases/base-ui/editor/document/ui/editor-toolbar';
import { SlashMenu } from '@/registry/bases/base-ui/editor/document/ui/slash-menu';

// Sends nothing: it fills the progress over two seconds, then answers a file the site already serves.
const upload = simulatedUpload({
  address: () => 'https://ui.zeroxsolutions.com/r/styles/base-nova/document-editor.json',
});

const features = [standardKit(), file({ upload })];
const contributions = collectUiContributions(features);

function paragraph(text: string): NodeJSON {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

const content: DocJSON = {
  type: 'doc',
  content: [
    paragraph('The registry item the Document Editor installs from:'),
    {
      type: 'file',
      attrs: {
        name: 'document-editor.json',
        href: 'https://ui.zeroxsolutions.com/r/styles/base-nova/document-editor.json',
        size: 89702,
      },
    },
    paragraph('Paste or drop a file here to attach it, or type / and pick File to upload one.'),
  ],
};

/** A document with a file to download. */
function EditorFileDemo(): ReactNode {
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

export { EditorFileDemo };
