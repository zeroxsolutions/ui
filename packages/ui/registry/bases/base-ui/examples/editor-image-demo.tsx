'use client';

import { useState, type ReactNode } from 'react';

import type { IEditor } from '@zeroxsolutions/editor-core/document/core/types/editor';
import type { DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/types/json';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/collect-ui-contributions';

import { image } from '@/registry/bases/base-ui/editor/document/features/image';
import { standardKit } from '@/registry/bases/base-ui/editor/document/features/standard';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';
import { BubbleMenu } from '@/registry/bases/base-ui/editor/document/ui/bubble-menu';
import { EditorToolbar } from '@/registry/bases/base-ui/editor/document/ui/editor-toolbar';
import { SlashMenu } from '@/registry/bases/base-ui/editor/document/ui/slash-menu';

const features = [standardKit(), image()];
const contributions = collectUiContributions(features);

function paragraph(text: string): NodeJSON {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

const lantern =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="240"><rect width="640" height="240" fill="#f59e0b"/><circle cx="320" cy="120" r="70" fill="#dc2626"/></svg>',
  );

const content: DocJSON = {
  type: 'doc',
  content: [
    paragraph('Select the image to edit its alt text and width.'),
    { type: 'image', attrs: { src: lantern, alt: 'A red paper lantern on an amber wall', title: '', width: null } },
  ],
};

/** A document with an image and its alt text. */
function EditorImageDemo(): ReactNode {
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

export { EditorImageDemo };
