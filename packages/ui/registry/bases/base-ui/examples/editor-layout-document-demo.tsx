'use client';

import { useState, type ReactNode } from 'react';

import type { IEditor, DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';

import { card as cardBlock } from '@zeroxsolutions/editor-core/blocks/index';
import { card } from '@/registry/bases/base-ui/editor/document/features/card';
import { columns } from '@/registry/bases/base-ui/editor/document/features/columns';
import { image } from '@/registry/bases/base-ui/editor/document/features/image';
import { section } from '@/registry/bases/base-ui/editor/document/features/section';
import { standardKit } from '@/registry/bases/base-ui/editor/document/features/standard';
import { table } from '@/registry/bases/base-ui/editor/document/features/table';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';
import { BubbleMenu } from '@/registry/bases/base-ui/editor/document/ui/bubble-menu';
import { EditorToolbar } from '@/registry/bases/base-ui/editor/document/ui/editor-toolbar';
import { SlashMenu } from '@/registry/bases/base-ui/editor/document/ui/slash-menu';

const features = [standardKit(), image(), columns(), table(), card(cardBlock), section()];
const contributions = collectUiContributions(features);

function paragraph(text: string): NodeJSON {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

const SHARE = 'https://ui.zeroxsolutions.com/og/docs/editor';

const cell = (type: 'tableHeader' | 'tableCell', text: string): NodeJSON => ({ type, content: [paragraph(text)] });

const content: DocJSON = {
  type: 'doc',
  content: [
    paragraph('Select the image to align it, drag its sides or make it full width.'),
    {
      type: 'image',
      attrs: {
        src: `${SHARE}/document-editor/image.png`,
        alt: 'The Document Editor share card',
        align: 'center',
        width: 0.5,
      },
    },
    paragraph('Drag the line between the two columns, or add one from their toolbar.'),
    {
      type: 'columns',
      attrs: { ratio: [8, 4], valign: 'center' },
      content: [
        { type: 'column', content: [paragraph('Two thirds of the line, held in the middle of the taller lane.')] },
        { type: 'column', content: [paragraph('One third.')] },
      ],
    },
    {
      type: 'table',
      attrs: { columnWidths: [0.3, 0.7] },
      content: [
        { type: 'tableRow', content: [cell('tableHeader', 'Block'), cell('tableHeader', 'Its layout')] },
        { type: 'tableRow', content: [cell('tableCell', 'Table'), cell('tableCell', 'Column widths and full width')] },
      ],
    },
    {
      type: 'section',
      attrs: { background: 'muted', padding: 'large', width: 'wide' },
      content: [
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'A wide section' }] },
        {
          type: 'card',
          attrs: {
            image: `${SHARE}/email-editor/image.png`,
            alt: 'The Email Editor share card',
            heading: 'Email Editor',
            buttonLabel: 'Read the guide',
            buttonHref: 'https://ui.zeroxsolutions.com/docs/editor/email-editor',
            width: 0.7,
            align: 'center',
          },
          content: [{ type: 'text', text: 'A card at seven tenths of the section, in its middle.' }],
        },
      ],
    },
  ],
};

/** A page laid out in the Document Editor: a resized image, weighed columns, a sized table and a wide section. */
function EditorLayoutDocumentDemo(): ReactNode {
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

export { EditorLayoutDocumentDemo };
