'use client';

import { useState, type ReactNode } from 'react';

import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { emailProfile, type EditorEmailBlock } from '@zeroxsolutions/editor-core/profiles/index';

import { emailPresets, EditorPresetsPanel } from '@/registry/bases/base-ui/editor/document/features/presets';
import { EmailEditor } from '@/registry/bases/base-ui/editor/profiles/email/email-editor';

const profile = emailProfile();
const presets = emailPresets(profile);

const initial: EditorEmailBlock[] = [
  {
    id: 'intro',
    key: 'intro',
    type: 'paragraph',
    attributes: {},
    content: { text: 'Drag a preset from the panel, click one, or type / and pick one under Presets.' },
  },
];

/** An email beside a panel of the library's email presets: a header, a hero, a call to action, a two-up and a footer. */
function BlockPresetsEmailDemo(): ReactNode {
  const [blocks, setBlocks] = useState(initial);
  const [editor, setEditor] = useState<IEditor | null>(null);
  return (
    <div className="@container w-full max-w-4xl">
      <div className="grid items-start gap-4 @2xl:grid-cols-[minmax(0,1fr)_16rem]">
        <EmailEditor
          label="Email body"
          profile={profile}
          presets={presets}
          value={blocks}
          onChange={setBlocks}
          onReady={setEditor}
        />
        {editor && <EditorPresetsPanel editor={editor} presets={presets} />}
      </div>
    </div>
  );
}

export { BlockPresetsEmailDemo };
