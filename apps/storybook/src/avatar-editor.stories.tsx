import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  AvatarEditor,
  AvatarEditorColor,
  AvatarEditorContent,
  AvatarEditorEmoji,
  AvatarEditorTrigger,
  AvatarEditorUpload,
  type AvatarValue,
} from '@chiselart/ui';

const meta: Meta<typeof AvatarEditor> = {
  title: 'Components/AvatarEditor',
  component: AvatarEditor,
  parameters: {
    docs: {
      description: {
        component:
          'LobeHub-style avatar editor — a compound popover. The Root holds the ' +
          'value; compose AvatarEditorTrigger + AvatarEditorContent, and include ' +
          'the tab parts (Emoji / Upload / Color) you want. The icon strip is ' +
          'built from the parts present; each part owns its copy via children.',
      },
    },
  },
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
        <span>{value.emoji ?? '🙂'}</span>
      )}
    </div>
  );
}

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<AvatarValue>({
      emoji: '😎',
      color: '#6366f1',
      imageUrl: null,
    });
    return (
      <AvatarEditor value={value} onChange={setValue}>
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

export const EmptyDefault: Story = {
  render: () => {
    const [value, setValue] = useState<AvatarValue>({
      emoji: null,
      color: '#10b981',
      imageUrl: null,
    });
    return (
      <AvatarEditor value={value} onChange={setValue}>
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

/** Photo-only avatar (the profile use case): include just the Upload tab — the
 * strip is hidden, and `children` override the dropzone copy. */
export const UploadOnly: Story = {
  render: () => {
    const [value, setValue] = useState<AvatarValue>({ imageUrl: null });
    return (
      <AvatarEditor value={value} onChange={setValue}>
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
