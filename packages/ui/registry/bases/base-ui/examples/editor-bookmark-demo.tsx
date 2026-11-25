'use client';

import { useState, type ReactNode } from 'react';

import type { IEditor, DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';

import { bookmark, type LinkPreview } from '@/registry/bases/base-ui/editor/document/features/bookmark';
import { standardKit } from '@/registry/bases/base-ui/editor/document/features/standard';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';
import { BubbleMenu } from '@/registry/bases/base-ui/editor/document/ui/bubble-menu';
import { EditorToolbar } from '@/registry/bases/base-ui/editor/document/ui/editor-toolbar';
import { SlashMenu } from '@/registry/bases/base-ui/editor/document/ui/slash-menu';

const features = [standardKit(), bookmark({ readLink })];
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
    paragraph('Type / and pick Bookmark, then paste a link to the Document Editor docs.'),
    {
      type: 'bookmark',
      attrs: {
        url: 'https://ui.zeroxsolutions.com/docs/editor/email-editor',
        title: 'Email Editor',
        description: 'A block editor for an email body, with variables and a preview of the rendered email.',
        image: 'https://ui.zeroxsolutions.com/og/docs/editor/email-editor/image.png',
      },
    },
  ],
};

/** A document with a bookmark to a docs page. */
function EditorBookmarkDemo(): ReactNode {
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

export { EditorBookmarkDemo };
