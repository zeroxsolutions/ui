'use client';

import { useState, type ReactNode } from 'react';

import type { IEditor } from '@zeroxsolutions/editor-core/document/core/types/editor';
import type { DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/types/json';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/collect-ui-contributions';

import { embed } from '@/registry/bases/base-ui/editor/document/features/embed';
import { standardKit } from '@/registry/bases/base-ui/editor/document/features/standard';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';
import { BubbleMenu } from '@/registry/bases/base-ui/editor/document/ui/bubble-menu';
import { EditorToolbar } from '@/registry/bases/base-ui/editor/document/ui/editor-toolbar';
import { SlashMenu } from '@/registry/bases/base-ui/editor/document/ui/slash-menu';

const features = [standardKit(), embed()];
const contributions = collectUiContributions(features);

function paragraph(text: string): NodeJSON {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

/** The embedded page, written into its own URL so the demo loads nothing from another site. */
const EMBEDDED_PAGE = `data:text/html;charset=utf-8,${encodeURIComponent(
  '<!doctype html><meta name="color-scheme" content="light dark"><title>Hoi An old town</title>' +
    '<body style="margin:0;display:grid;place-items:center;height:100vh;font-family:system-ui,sans-serif">' +
    '<p>Hoi An old town</p></body>',
)}`;

const content: DocJSON = {
  type: 'doc',
  content: [
    paragraph('An empty embed asks for a URL; this one already has one.'),
    {
      type: 'embed',
      attrs: {
        url: EMBEDDED_PAGE,
        title: 'Hoi An old town',
      },
    },
  ],
};

/** A document with a page embedded from a URL. */
function EditorEmbedDemo(): ReactNode {
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

export { EditorEmbedDemo };
