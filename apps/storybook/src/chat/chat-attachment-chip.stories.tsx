import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { ChatAttachmentChip } from '@zeroxsolutions/ui/components/chat/chat-attachment-chip';

const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * `ChatAttachmentChip` is a presentational thumbnail chip for one pending
 * attachment, shown above a composer textarea before the message is sent. An
 * `image` kind renders its `dataUrl` thumbnail; every other kind renders a file
 * icon plus the file name. The X button reports removal through `onRemove`,
 * while the host owns the attachment list.
 */
const meta: Meta<typeof ChatAttachmentChip> = {
  title: 'Chat/AttachmentChip',
  component: ChatAttachmentChip,
};
export default meta;

type Story = StoryObj<typeof ChatAttachmentChip>;

/**
 * The three attachment kinds side by side: an `image` thumbnail, a `text` file
 * icon, and a `pdf` shown `compact`. Each chip's X button removes it from local
 * state.
 */
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
