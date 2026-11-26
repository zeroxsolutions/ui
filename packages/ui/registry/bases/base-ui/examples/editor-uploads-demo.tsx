'use client';

import { useId, useMemo, useRef, useState, type ReactNode } from 'react';

import { card as cardBlock } from '@zeroxsolutions/editor-core/blocks/index';
import type { IEditor, DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';

import { card } from '@/registry/bases/base-ui/editor/document/features/card';
import { file } from '@/registry/bases/base-ui/editor/document/features/file';
import { image } from '@/registry/bases/base-ui/editor/document/features/image';
import { media } from '@/registry/bases/base-ui/editor/document/features/media';
import { standardKit } from '@/registry/bases/base-ui/editor/document/features/standard';
import { Editor } from '@/registry/bases/base-ui/editor/document/react';
import { simulatedUpload } from '@/registry/bases/base-ui/editor/document/uploads';
import { SlashMenu } from '@/registry/bases/base-ui/editor/document/ui/slash-menu';
import { Label } from '@/registry/bases/base-ui/ui/label';
import { Switch } from '@/registry/bases/base-ui/ui/switch';

/** Stand-ins the simulated upload answers with, since it stores nothing: each already serves a file of its kind. */
const SAMPLE = {
  image: 'https://ui.zeroxsolutions.com/og/docs/editor/document-editor/image.png',
  video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  audio: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
  file: 'https://ui.zeroxsolutions.com/r/styles/base-nova/document-editor.json',
};

function sampleOf(picked: File): string {
  const [group] = picked.type.split('/');
  return group === 'image' || group === 'video' || group === 'audio' ? SAMPLE[group] : SAMPLE.file;
}

function paragraph(text: string): NodeJSON {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

const content: DocJSON = {
  type: 'doc',
  content: [
    paragraph('Paste or drop an image, a video, a sound or any other file here. Each becomes its block and uploads.'),
    { type: 'image', attrs: { src: SAMPLE.image, alt: 'The Document Editor share card', title: '', width: 320 } },
    paragraph('Or open the image with Edit and pick a file on its Upload tab.'),
  ],
};

/** The Document Editor uploading into its blocks through an upload that sends nothing. */
function EditorUploadsDemo(): ReactNode {
  const switchId = useId();
  const [editor, setEditor] = useState<IEditor | null>(null);
  const [failing, setFailing] = useState(false);
  const fails = useRef(failing);
  fails.current = failing;
  const features = useMemo(() => {
    const upload = simulatedUpload({ address: sampleOf, fails: () => fails.current });
    return [
      standardKit(),
      image({ upload }),
      file({ upload, maxBytes: 20 * 1024 * 1024 }),
      media({ upload }),
      card(cardBlock, { upload }),
    ];
  }, []);
  const contributions = useMemo(() => collectUiContributions(features), [features]);
  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <div className="flex items-center gap-2 self-start">
        <Switch id={switchId} checked={failing} onCheckedChange={setFailing} />
        <Label htmlFor={switchId}>Fail the uploads</Label>
      </div>
      <Editor features={features} content={content} onReady={setEditor} />
      {editor && <SlashMenu editor={editor} items={contributions.slash} />}
    </div>
  );
}

export { EditorUploadsDemo };
