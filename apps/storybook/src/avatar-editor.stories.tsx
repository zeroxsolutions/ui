import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { FluentEmoji } from '@zeroxsolutions/fluent-emoji';
import {
  AvatarEditor,
  AvatarEditorColor,
  AvatarEditorContent,
  AvatarEditorEmoji,
  AvatarEditorTrigger,
  AvatarEditorUpload,
  type AvatarValue,
} from '@zeroxsolutions/ui/avatar-editor';
import { Button } from '@zeroxsolutions/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@zeroxsolutions/ui/dialog';

/**
 * A compound popover avatar editor — the Root holds the value; compose
 * `AvatarEditorTrigger` + `AvatarEditorContent`, and include the tab parts
 * (Emoji / Upload / Color) you want. The icon strip is built from the parts
 * present; each part owns its copy via children.
 */
const meta: Meta<typeof AvatarEditor> = {
  title: 'Components/AvatarEditor',
  component: AvatarEditor,
};
export default meta;

type Story = StoryObj<typeof AvatarEditor>;

/** The clickable avatar tile that triggers the editor. */
function AvatarTile({ value }: { value: AvatarValue }) {
  return (
    <div
      className="flex size-16 items-center justify-center overflow-hidden rounded-xl text-3xl shadow-sm"
      style={{ backgroundColor: value.color ?? '#6366f1' }}
    >
      {value.imageUrl ? (
        <img src={value.imageUrl} alt="" className="size-full object-cover" />
      ) : (
        <FluentEmoji
          glyph={value.emoji ?? '🙂'}
          className="size-full object-contain p-[12%]"
        />
      )}
    </div>
  );
}

/** The full editor: all three tab parts (Emoji / Upload / Color), seeded with an
 * emoji and color so the trigger tile shows a glyph. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<AvatarValue>({
      emoji: '😎',
      color: '#6366f1',
      imageUrl: null,
    });
    return (
      <AvatarEditor value={value} onValueChange={setValue}>
        <AvatarEditorTrigger>
          <AvatarTile value={value} />
        </AvatarEditorTrigger>
        <AvatarEditorContent>
          <AvatarEditorEmoji />
          <AvatarEditorUpload />
          <AvatarEditorColor />
        </AvatarEditorContent>
      </AvatarEditor>
    );
  },
};

/** The empty starting state: no emoji or image, only a color — the trigger tile
 * falls back to its placeholder glyph until a part sets a value. */
export const EmptyDefault: Story = {
  render: () => {
    const [value, setValue] = useState<AvatarValue>({
      emoji: null,
      color: '#10b981',
      imageUrl: null,
    });
    return (
      <AvatarEditor value={value} onValueChange={setValue}>
        <AvatarEditorTrigger>
          <AvatarTile value={value} />
        </AvatarEditorTrigger>
        <AvatarEditorContent>
          <AvatarEditorEmoji />
          <AvatarEditorUpload />
          <AvatarEditorColor />
        </AvatarEditorContent>
      </AvatarEditor>
    );
  },
};

/** The web-app scenario: the editor lives inside a modal Dialog. Because the
 * Dialog and the Popover are BOTH Base UI, the nested emoji popover stays
 * interactive. A Radix modal Dialog would block it — Radix sets
 * `body { pointer-events: none }`, which a portaled Base UI popup inherits. */
export const InsideDialog: Story = {
  render: () => {
    const [value, setValue] = useState<AvatarValue>({
      emoji: '😎',
      color: '#6366f1',
      imageUrl: null,
    });
    return (
      <Dialog>
        <DialogTrigger render={<Button variant="outline">Edit agent</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit agent</DialogTitle>
            <DialogDescription>
              Click the avatar to pick an emoji, upload an image, or set a
              colour.
            </DialogDescription>
          </DialogHeader>
          <AvatarEditor value={value} onValueChange={setValue}>
            <AvatarEditorTrigger>
              <AvatarTile value={value} />
            </AvatarEditorTrigger>
            <AvatarEditorContent>
              <AvatarEditorEmoji />
              <AvatarEditorUpload />
              <AvatarEditorColor />
            </AvatarEditorContent>
          </AvatarEditor>
        </DialogContent>
      </Dialog>
    );
  },
};

/** Photo-only avatar (the profile use case): include just the Upload tab — the
 * strip is hidden, and `children` override the dropzone copy. */
export const UploadOnly: Story = {
  render: () => {
    const [value, setValue] = useState<AvatarValue>({ imageUrl: null });
    return (
      <AvatarEditor value={value} onValueChange={setValue}>
        <AvatarEditorTrigger>
          <AvatarTile value={value} />
        </AvatarEditorTrigger>
        <AvatarEditorContent>
          <AvatarEditorUpload />
        </AvatarEditorContent>
      </AvatarEditor>
    );
  },
};
