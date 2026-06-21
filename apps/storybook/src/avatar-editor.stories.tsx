import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AvatarEditor, type AvatarValue } from '@chiselart/ui';

const meta: Meta<typeof AvatarEditor> = {
  title: 'Components/AvatarEditor',
  component: AvatarEditor,
  parameters: {
    docs: {
      description: {
        component:
          'LobeHub-style avatar editor: a popover from the avatar tile with ' +
          'Emoji · Upload · Color tabs and a Remove action.',
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
        <AvatarTile value={value} />
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
        <AvatarTile value={value} />
      </AvatarEditor>
    );
  },
};
