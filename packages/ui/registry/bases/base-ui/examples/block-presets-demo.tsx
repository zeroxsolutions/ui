'use client';

import { useState, type ReactNode } from 'react';

import { card as cardBlock } from '@zeroxsolutions/editor-core/blocks/index';
import type { IEditor, DocJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';

import { button } from '@/registry/bases/base-ui/editor/document/features/button';
import { callout } from '@/registry/bases/base-ui/editor/document/features/callout';
import { card } from '@/registry/bases/base-ui/editor/document/features/card';
import { columns } from '@/registry/bases/base-ui/editor/document/features/columns';
import {
  documentPresets,
  EditorPresetsPanel,
  presetsFeature,
} from '@/registry/bases/base-ui/editor/document/features/presets';
import { standardKit } from '@/registry/bases/base-ui/editor/document/features/standard';
import { toggleHeading } from '@/registry/bases/base-ui/editor/document/features/toggle-heading';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';
import { SlashMenu } from '@/registry/bases/base-ui/editor/document/ui/slash-menu';

const presets = documentPresets();

// Each library preset holds one of these blocks; an editor without a preset's block does not offer that preset.
const features = [
  standardKit(),
  button(),
  callout(),
  card(cardBlock),
  columns(),
  toggleHeading(),
  presetsFeature(presets),
];
const contributions = collectUiContributions(features);

const content: DocJSON = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Drag a preset from the panel, click one, or type / and pick one under Presets.' },
      ],
    },
  ],
};

/** A document beside a panel of the library's presets: two columns, an FAQ, a callout with a button and two cards. */
function BlockPresetsDemo(): ReactNode {
  const [editor, setEditor] = useState<IEditor | null>(null);
  return (
    <div className="grid w-full max-w-4xl items-start gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
      <Editor features={features} content={content} onReady={setEditor} />
      {editor && <SlashMenu editor={editor} items={contributions.slash} />}
      {editor && <EditorPresetsPanel editor={editor} presets={presets} />}
    </div>
  );
}

export { BlockPresetsDemo };
