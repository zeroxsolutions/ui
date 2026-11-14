'use client';

import { useState, type ReactNode } from 'react';

import type { IEditor } from '@zeroxsolutions/editor-core/document/core/types/editor';
import type { DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/types/json';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/collect-ui-contributions';

import { callout, standardKit, toggle } from '@/registry/bases/base-ui/editor/document/features';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';
import { BubbleMenu } from '@/registry/bases/base-ui/editor/document/ui/bubble-menu';
import { EditorToolbar } from '@/registry/bases/base-ui/editor/document/ui/editor-toolbar';
import { SlashMenu } from '@/registry/bases/base-ui/editor/document/ui/slash-menu';

const features = [standardKit(), callout(), toggle()];
const contributions = collectUiContributions(features);

function paragraph(text: string): NodeJSON {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

const content: DocJSON = {
  type: 'doc',
  content: [
    {
      type: 'callout',
      attrs: { variant: 'info' },
      content: [paragraph('Every feature comes from the same barrel as the standard kit.')],
    },
    paragraph('Type / on an empty line to add a callout or a toggle.'),
  ],
};

/** A document over features read from the barrel: the standard kit, a callout and a toggle. */
function EditorFeaturesDemo(): ReactNode {
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

export { EditorFeaturesDemo };
