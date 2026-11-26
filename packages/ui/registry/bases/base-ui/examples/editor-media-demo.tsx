'use client';

import { useState, type ReactNode } from 'react';

import type { IEditor, DocJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';

import { media } from '@/registry/bases/base-ui/editor/document/features/media';
import { standardKit } from '@/registry/bases/base-ui/editor/document/features/standard';
import { simulatedUpload } from '@/registry/bases/base-ui/editor/document/uploads';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';
import { BubbleMenu } from '@/registry/bases/base-ui/editor/document/ui/bubble-menu';
import { EditorToolbar } from '@/registry/bases/base-ui/editor/document/ui/editor-toolbar';
import { SlashMenu } from '@/registry/bases/base-ui/editor/document/ui/slash-menu';

// Sends nothing: it fills the progress over two seconds, then answers a sample of the file's kind.
const upload = simulatedUpload({
  address: (picked) =>
    picked.type.startsWith('audio/')
      ? 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3'
      : 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
});

const features = [standardKit(), media({ upload })];
const contributions = collectUiContributions(features);

const content: DocJSON = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Paste or drop a video or a sound here, or type / and pick Video or Audio.' }],
    },
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
      type: 'media',
      attrs: {
        kind: 'audio',
        src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
        poster: '',
        caption: 'A roar, from the MDN sample media.',
      },
    },
  ],
};

/** A document with a video and an audio player. */
function EditorMediaDemo(): ReactNode {
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

export { EditorMediaDemo };
