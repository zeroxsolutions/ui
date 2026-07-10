import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import type { DocJSON, EditorFeature, IEditor } from '@zeroxsolutions/editor/document/core/index';
import { Editor } from '@zeroxsolutions/editor/document/react/editor';
import {
  BlockMenu,
  BubbleMenu,
  EditorToolbar,
  SlashMenu,
  collectUiContributions,
  defaultBlockMenuItems,
} from '@zeroxsolutions/editor/document/ui/index';
import { standardKit } from '@zeroxsolutions/editor/document/features/standard/index';
import { callout } from '@zeroxsolutions/editor/document/features/callout/index';
import { toggle } from '@zeroxsolutions/editor/document/features/toggle/index';
import { link } from '@zeroxsolutions/editor/document/features/link/index';
import { image } from '@zeroxsolutions/editor/document/features/image/index';
import { table } from '@zeroxsolutions/editor/document/features/table/index';
import { codeBlock } from '@zeroxsolutions/editor/document/features/code-block/index';
import { math } from '@zeroxsolutions/editor/document/features/math/index';
import { mermaid } from '@zeroxsolutions/editor/document/features/mermaid/index';
import { mention } from '@zeroxsolutions/editor/document/features/mention/index';
import { embed } from '@zeroxsolutions/editor/document/features/embed/index';
import { featureBlocksDoc, sampleDoc } from './sample-doc';

/**
 * The editable `<Editor/>` with the full chrome — toolbar, slash menu (`/`),
 * bubble menu (select text), and a hover block menu — all composed from
 * `@zeroxsolutions/ui` and driven through the engine-free `IEditor` façade.
 */
const allFeatures = (): EditorFeature[] => [
  standardKit(),
  callout(),
  toggle(),
  link(),
  image(),
  table(),
  codeBlock(),
  math(),
  mermaid(),
  mention(),
  embed(),
];

function EditorPlayground({
  content,
  editable = true,
}: {
  content: DocJSON;
  editable?: boolean;
}) {
  const features = useRef(allFeatures()).current;
  const ui = useRef(collectUiContributions(features)).current;
  const containerRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<IEditor | null>(null);

  return (
    <div className="mx-auto max-w-2xl rounded-lg border bg-background p-3 text-foreground">
      {editor && editable && (
        <EditorToolbar editor={editor} items={ui.toolbar} className="mb-2 border-b pb-2" />
      )}
      <div ref={containerRef} className="relative">
        <Editor
          features={features}
          content={content}
          editable={editable}
          onReady={setEditor}
          className="min-h-48 outline-none"
        />
        {editor && editable && (
          <>
            <SlashMenu editor={editor} items={ui.slash} />
            <BubbleMenu editor={editor} items={ui.bubble} container={containerRef.current} />
            <BlockMenu
              editor={editor}
              items={[...ui.blockMenu, ...defaultBlockMenuItems]}
              container={containerRef.current}
            />
          </>
        )}
      </div>
    </div>
  );
}

const meta: Meta<typeof EditorPlayground> = {
  title: 'Editor/Editor',
  component: EditorPlayground,
};
export default meta;

type Story = StoryObj<typeof EditorPlayground>;

/** The full editing experience: type `/` for the slash menu, select text for the
 *  bubble menu, hover a block for its drag-handle menu. */
export const Default: Story = {
  render: () => <EditorPlayground content={sampleDoc} />,
};

/** Every feature block rendered together (callout, toggle, code, math, mermaid, table). */
export const FeatureBlocks: Story = {
  render: () => <EditorPlayground content={featureBlocksDoc} />,
};

/** A read-only editor — no chrome, `editable={false}`. */
export const ReadOnly: Story = {
  render: () => <EditorPlayground content={sampleDoc} editable={false} />,
};
