'use client';

import { useState, type ReactNode } from 'react';

import type { IEditor } from '@zeroxsolutions/editor-core/document/core/types/editor';
import type { DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/types/json';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/collect-ui-contributions';

import { mention } from '@/registry/bases/base-ui/editor/document/features/mention';
import { standardKit } from '@/registry/bases/base-ui/editor/document/features/standard';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';
import { BubbleMenu } from '@/registry/bases/base-ui/editor/document/ui/bubble-menu';
import { EditorToolbar } from '@/registry/bases/base-ui/editor/document/ui/editor-toolbar';
import { SlashMenu } from '@/registry/bases/base-ui/editor/document/ui/slash-menu';

const features = [standardKit(), mention()];
const contributions = collectUiContributions(features);

function paragraph(text: string): NodeJSON {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

const content: DocJSON = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Ask ' },
        { type: 'mention', attrs: { id: 'u-linh', label: 'Linh' } },
        { type: 'text', text: ' or ' },
        { type: 'mention', attrs: { id: 'u-minh', label: 'Minh' } },
        { type: 'text', text: ' about the ferry times.' },
      ],
    },
  ],
};

/** A document with two mentions in a sentence. */
function EditorMentionDemo(): ReactNode {
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

export { EditorMentionDemo };
