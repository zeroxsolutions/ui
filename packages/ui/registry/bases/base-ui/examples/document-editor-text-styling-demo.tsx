'use client';

import { useState, type ReactNode } from 'react';

import type { IEditor, DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';

import { standardKit } from '@/registry/bases/base-ui/editor/document/features/standard';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';
import { BubbleMenu } from '@/registry/bases/base-ui/editor/document/ui/bubble-menu';
import { EditorToolbar } from '@/registry/bases/base-ui/editor/document/ui/editor-toolbar';
import { SlashMenu } from '@/registry/bases/base-ui/editor/document/ui/slash-menu';

const features = [standardKit()];
const contributions = collectUiContributions(features);

const text = (value: string, marks?: NodeJSON['marks']): NodeJSON => ({ type: 'text', text: value, marks });

const content: DocJSON = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2, textAlign: 'center' },
      content: [text('A centred heading')],
    },
    {
      type: 'paragraph',
      attrs: { size: 'lead', textAlign: 'center' },
      content: [text('A lead paragraph, larger than the text around it.')],
    },
    {
      type: 'paragraph',
      content: [
        text('Select words to colour them: '),
        text('red', [{ type: 'textColor', attrs: { token: 'red' } }]),
        text(', '),
        text('teal', [{ type: 'textColor', attrs: { token: 'teal' } }]),
        text(' or '),
        text('on amber', [{ type: 'textBackground', attrs: { token: 'amber' } }]),
        text('. Each colour follows light and dark mode.'),
      ],
    },
    {
      type: 'paragraph',
      attrs: { textAlign: 'justify' },
      content: [
        text(
          'A justified paragraph spreads its words to both edges of the line. The bubble aligns the paragraphs of a selection, and the block menu turns one into Lead or Small.',
        ),
      ],
    },
    {
      type: 'paragraph',
      attrs: { size: 'small', textAlign: 'end' },
      content: [text('A small line, at the end of the line.')],
    },
  ],
};

/** Text in the Document Editor: aligned lines, lead and small paragraphs, and text and background colours. */
function DocumentEditorTextStylingDemo(): ReactNode {
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

export { DocumentEditorTextStylingDemo };
