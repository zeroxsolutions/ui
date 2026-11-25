'use client';

import { useState, type ReactNode } from 'react';

import type { IEditor, DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';

import { toggleHeading } from '@/registry/bases/base-ui/editor/document/features/toggle-heading';
import { standardKit } from '@/registry/bases/base-ui/editor/document/features/standard';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';
import { BubbleMenu } from '@/registry/bases/base-ui/editor/document/ui/bubble-menu';
import { EditorToolbar } from '@/registry/bases/base-ui/editor/document/ui/editor-toolbar';
import { SlashMenu } from '@/registry/bases/base-ui/editor/document/ui/slash-menu';

const features = [standardKit(), toggleHeading()];
const contributions = collectUiContributions(features);

function paragraph(text: string): NodeJSON {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

const content: DocJSON = {
  type: 'doc',
  content: [
    {
      type: 'toggleHeading',
      attrs: { open: true },
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Install' }] },
        paragraph('Add the editor and the features you want.'),
      ],
    },
    {
      type: 'toggleHeading',
      attrs: { open: false },
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Styles' }] },
        paragraph('The folded heading keeps this paragraph until you open it.'),
      ],
    },
  ],
};

/** A document with an open toggle heading and a folded one. */
function EditorToggleHeadingDemo(): ReactNode {
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

export { EditorToggleHeadingDemo };
