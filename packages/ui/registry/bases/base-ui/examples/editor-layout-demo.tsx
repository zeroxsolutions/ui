'use client';

import { useState, type ReactNode } from 'react';
import { z } from 'zod';

import {
  defineFeature,
  type DocJSON,
  type EditorFeature,
  type NodeViewProps,
} from '@zeroxsolutions/editor-core/document/core/index';

import { standardKit } from '@/registry/bases/base-ui/editor/document/features/standard';
import {
  AlignControl,
  BlockToolbar,
  DEFAULT_LAYOUT_WORDS,
  layoutProps,
  ResizeHandles,
  WidthToggle,
} from '@/registry/bases/base-ui/editor/document/layout';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';

const panelAttrs = z.object({
  align: z.enum(['start', 'center', 'end']).nullable().default(null),
  width: z
    .union([z.number(), z.literal('full')])
    .nullable()
    .default(null),
});

/**
 * A block drawn as a media block's view draws its layout: its toolbar while it is selected, the handles on its
 * sides, and the width a drag previews before the one change it commits.
 */
function PanelView({
  attrs,
  editor,
  getPos,
  selected,
  editable,
}: NodeViewProps<z.infer<typeof panelAttrs>>): ReactNode {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const words = DEFAULT_LAYOUT_WORDS;
  const set = (layout: Record<string, unknown>) => editor.run('setBlockLayout', { pos: getPos(), layout });
  return (
    <div
      ref={setAnchor}
      {...layoutProps({ ...attrs, width: preview ?? attrs.width })}
      className="cn-editor-block bg-muted text-muted-foreground relative my-4 flex h-28 items-center justify-center"
    >
      A block that takes a layout
      {editable && selected && attrs.width !== 'full' && (
        <ResizeHandles
          value={typeof attrs.width === 'number' ? attrs.width : 1}
          align={attrs.align ?? 'start'}
          words={words}
          onPreview={setPreview}
          onCommit={(width) => {
            setPreview(null);
            set({ width });
          }}
          onCancel={() => setPreview(null)}
        />
      )}
      <BlockToolbar editor={editor} pos={getPos()} anchor={anchor} label={words.toolbar}>
        <AlignControl value={attrs.align} onChange={(align) => set({ align })} words={words} />
        <WidthToggle
          full={attrs.width === 'full'}
          onChange={(full) => set({ width: full ? 'full' : null })}
          words={words}
        />
      </BlockToolbar>
    </div>
  );
}

const panel: EditorFeature = defineFeature({
  id: 'panel',
  nodes: [
    {
      name: 'panel',
      group: 'block',
      atom: true,
      selectable: true,
      draggable: true,
      attrs: panelAttrs,
      render: PanelView,
    },
  ],
});

const features = [
  standardKit({ layout: { types: { panel: ['align', 'width', 'spaceBefore', 'spaceAfter'] } } }),
  panel,
];

const content: DocJSON = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Select the block below, then align it, drag its sides or press its arrow keys.' },
      ],
    },
    { type: 'panel', attrs: { align: 'center', width: 0.6 } },
  ],
};

/** The layout kit on a block of the Document Editor: its toolbar, its alignment, its full width and its handles. */
function EditorLayoutDemo(): ReactNode {
  return (
    <div className="w-full max-w-2xl">
      <Editor features={features} content={content} />
    </div>
  );
}

export { EditorLayoutDemo };
