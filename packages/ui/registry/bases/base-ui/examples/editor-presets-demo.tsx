'use client';

import { useState, type ReactNode } from 'react';

import { definePreset } from '@zeroxsolutions/editor-core/blocks/index';
import type { IEditor, DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';

import { button } from '@/registry/bases/base-ui/editor/document/features/button';
import { callout } from '@/registry/bases/base-ui/editor/document/features/callout';
import { columns } from '@/registry/bases/base-ui/editor/document/features/columns';
import { EditorPresetsPanel, presetsFeature } from '@/registry/bases/base-ui/editor/document/features/presets';
import { standardKit } from '@/registry/bases/base-ui/editor/document/features/standard';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';
import { SlashMenu } from '@/registry/bases/base-ui/editor/document/ui/slash-menu';

function paragraph(text: string): NodeJSON {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

function heading(text: string): NodeJSON {
  return { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text }] };
}

const presets = [
  definePreset({
    id: 'two-columns',
    label: 'Two columns',
    description: 'A heading and a line of text, side by side',
    keywords: ['layout', 'side by side'],
    content: [
      {
        type: 'columns',
        attrs: { ratio: [1, 1] },
        content: [
          { type: 'column', content: [heading('Morning'), paragraph('Walk the old town before it gets busy.')] },
          { type: 'column', content: [heading('Evening'), paragraph('Eat at the night market by the river.')] },
        ],
      },
    ],
  }),
  definePreset({
    id: 'tip',
    label: 'Tip',
    description: 'A heading over a callout',
    keywords: ['note', 'advice'],
    content: [
      heading('Good to know'),
      { type: 'callout', attrs: { variant: 'info' }, content: [paragraph('Most museums close on Mondays.')] },
    ],
  }),
];

const features = [standardKit(), button(), columns(), callout(), presetsFeature(presets)];
const contributions = collectUiContributions(features);

const content: DocJSON = {
  type: 'doc',
  content: [paragraph('Drag a preset from the panel, click one, or type / and pick one under Presets.')],
};

/** A document beside a panel of two presets, two columns and a tip in a callout, which its slash menu offers too. */
function EditorPresetsDemo(): ReactNode {
  const [editor, setEditor] = useState<IEditor | null>(null);
  return (
    <div className="grid w-full max-w-4xl items-start gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
      <Editor features={features} content={content} onReady={setEditor} />
      {editor && <SlashMenu editor={editor} items={contributions.slash} />}
      {editor && <EditorPresetsPanel editor={editor} presets={presets} />}
    </div>
  );
}

export { EditorPresetsDemo };
