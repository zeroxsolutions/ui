'use client';

import { useState, type ReactNode } from 'react';

import type { IEditor, DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';

import { columns } from '@/registry/bases/base-ui/editor/document/features/columns';
import { section } from '@/registry/bases/base-ui/editor/document/features/section';
import { standardKit } from '@/registry/bases/base-ui/editor/document/features/standard';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';
import { BubbleMenu } from '@/registry/bases/base-ui/editor/document/ui/bubble-menu';
import { EditorToolbar } from '@/registry/bases/base-ui/editor/document/ui/editor-toolbar';
import { SlashMenu } from '@/registry/bases/base-ui/editor/document/ui/slash-menu';

const features = [standardKit(), columns(), section()];
const contributions = collectUiContributions(features);

function paragraph(text: string): NodeJSON {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

const content: DocJSON = {
  type: 'doc',
  content: [
    paragraph('Click inside the section to set its background, padding and width.'),
    {
      type: 'section',
      attrs: { background: 'teal', padding: 'large' },
      content: [
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'A section of the page' }] },
        {
          type: 'columns',
          attrs: { ratio: [1, 1] },
          content: [
            { type: 'column', content: [paragraph('It holds any block but another section.')] },
            { type: 'column', content: [paragraph('Columns inside it stack on a narrow screen.')] },
          ],
        },
      ],
    },
    paragraph('Type / and pick Section to add one.'),
  ],
};

/** A document holding a section on a tinted background, with columns inside it. */
function EditorSectionDemo(): ReactNode {
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

export { EditorSectionDemo };
