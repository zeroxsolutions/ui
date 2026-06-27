import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { ChatAttachmentChip } from '@zeroxsolutions/ui/chat-attachment-chip';

const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const meta: Meta<typeof ChatAttachmentChip> = {
  title: 'Chat/AttachmentChip',
  component: ChatAttachmentChip,
};
export default meta;

type Story = StoryObj<typeof ChatAttachmentChip>;

export const Kinds: Story = {
  render: () => {
    const [chips, setChips] = useState([
      { id: '1', name: 'hero.png', kind: 'image' as const, dataUrl: PNG_1X1 },
      { id: '2', name: 'spec.txt', kind: 'text' as const },
      { id: '3', name: 'brief.pdf', kind: 'pdf' as const },
    ]);
    const remove = (id: string) =>
      setChips((prev) => prev.filter((c) => c.id !== id));
    return (
      <div className="flex items-center gap-3">
        {chips.map((chip) => (
          <ChatAttachmentChip
            key={chip.id}
            attachment={chip}
            onRemove={() => remove(chip.id)}
            compact={chip.kind === 'pdf'}
          />
        ))}
      </div>
    );
  },
};
