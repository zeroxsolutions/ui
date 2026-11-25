'use client';

import { useState, type ReactNode } from 'react';

import type { IEditor, DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';

import { card as cardBlock } from '@zeroxsolutions/editor-core/blocks/index';
import { bookmark, type LinkPreview } from '@/registry/bases/base-ui/editor/document/features/bookmark';
import { button } from '@/registry/bases/base-ui/editor/document/features/button';
import { card } from '@/registry/bases/base-ui/editor/document/features/card';
import { columns } from '@/registry/bases/base-ui/editor/document/features/columns';
import { file } from '@/registry/bases/base-ui/editor/document/features/file';
import { media } from '@/registry/bases/base-ui/editor/document/features/media';
import { tableOfContents } from '@/registry/bases/base-ui/editor/document/features/table-of-contents';
import { toggleHeading } from '@/registry/bases/base-ui/editor/document/features/toggle-heading';
import { standardKit } from '@/registry/bases/base-ui/editor/document/features/standard';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';
import { BubbleMenu } from '@/registry/bases/base-ui/editor/document/ui/bubble-menu';
import { EditorToolbar } from '@/registry/bases/base-ui/editor/document/ui/editor-toolbar';
import { SlashMenu } from '@/registry/bases/base-ui/editor/document/ui/slash-menu';

const features = [
  standardKit(),
  bookmark({ readLink }),
  button(),
  card(cardBlock),
  columns(),
  file(),
  media(),
  tableOfContents(),
  toggleHeading(),
];
const contributions = collectUiContributions(features);

function paragraph(text: string): NodeJSON {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

/** What the host read from each page it was asked about; a real host fetches the page on its server. */
const previews: Record<string, LinkPreview> = {
  'https://ui.zeroxsolutions.com/docs/editor/document-editor': {
    title: 'Document Editor',
    description: 'A block editor for documents, with a Viewer that draws the same blocks read-only.',
    image: 'https://ui.zeroxsolutions.com/og/docs/editor/document-editor/image.png',
  },
};

async function readLink(url: string): Promise<LinkPreview> {
  return previews[url] ?? {};
}

const content: DocJSON = {
  type: 'doc',
  content: [
    { type: 'tableOfContents' },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Links and files' }] },
    {
      type: 'bookmark',
      attrs: {
        url: 'https://ui.zeroxsolutions.com/docs/editor/email-editor',
        title: 'Email Editor',
        description: 'A block editor for an email body, with variables and a preview of the rendered email.',
        image: 'https://ui.zeroxsolutions.com/og/docs/editor/email-editor/image.png',
      },
    },
    {
      type: 'file',
      attrs: {
        name: 'document-editor.json',
        href: 'https://ui.zeroxsolutions.com/r/styles/base-nova/document-editor.json',
        size: 89702,
      },
    },
    {
      type: 'button',
      attrs: {
        label: 'Read the guide',
        href: 'https://ui.zeroxsolutions.com/docs/editor/document-editor',
        align: 'left',
      },
    },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Layout' }] },
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
    {
      type: 'columns',
      attrs: { ratio: [1, 1] },
      content: [
        { type: 'column', content: [paragraph('Write the document in the editor.')] },
        { type: 'column', content: [paragraph('Read it back in the Viewer, drawn the same way.')] },
      ],
    },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Media' }] },
    {
      type: 'media',
      attrs: {
        kind: 'video',
        src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        poster: '',
        caption: 'A flower opening, from the MDN sample media.',
      },
    },
    {
      type: 'toggleHeading',
      attrs: { open: false },
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Folded' }] },
        paragraph('A toggle heading folds the blocks under it.'),
      ],
    },
  ],
};

/** A document holding every block of the library, as the Document Editor draws it. */
function BlockLibraryDemo(): ReactNode {
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

export { BlockLibraryDemo };
