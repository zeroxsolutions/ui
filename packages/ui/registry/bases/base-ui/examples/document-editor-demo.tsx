'use client';

import { useState, type ReactNode } from 'react';

import type { IEditor } from '@zeroxsolutions/editor-core/document/core/types/editor';
import type { DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/types/json';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/collect-ui-contributions';

import { standardKit } from '@/registry/bases/base-ui/editor/document/features/standard';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';
import { BubbleMenu } from '@/registry/bases/base-ui/editor/document/ui/bubble-menu';
import { EditorToolbar } from '@/registry/bases/base-ui/editor/document/ui/editor-toolbar';
import { SlashMenu } from '@/registry/bases/base-ui/editor/document/ui/slash-menu';

const features = [standardKit()];
const contributions = collectUiContributions(features);

function paragraph(text: string): NodeJSON {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

function task(text: string, checked: boolean): NodeJSON {
  return { type: 'taskItem', attrs: { checked }, content: [paragraph(text)] };
}

const content: DocJSON = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Weekend in Hoi An' }] },
    paragraph('Select text to format it, or type / on an empty line to add a block.'),
    {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [paragraph('The old town by lantern light')] },
        { type: 'listItem', content: [paragraph('An Bang beach in the morning')] },
      ],
    },
    { type: 'taskList', content: [task('Book the bus from Da Nang', true), task('Pack a rain jacket', false)] },
  ],
};

/** A short document with a heading, a paragraph, a list and a task list, under the toolbar. */
function DocumentEditorDemo(): ReactNode {
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

export { DocumentEditorDemo };
