import type { Meta, StoryObj } from '@storybook/react-vite';

import { ChatAttachmentChip } from '@chiselart/ui/chat-attachment-chip';

const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const meta: Meta<typeof ChatAttachmentChip> = {
  title: 'Chat/AttachmentChip',
  component: ChatAttachmentChip,
};
export default meta;

type Story = StoryObj<typeof ChatAttachmentChip>;

export const Kinds: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <ChatAttachmentChip
        attachment={{ id: '1', name: 'hero.png', kind: 'image', dataUrl: PNG_1X1 }}
        onRemove={() => {}}
      />
      <ChatAttachmentChip
        attachment={{ id: '2', name: 'spec.txt', kind: 'text' }}
        onRemove={() => {}}
      />
      <ChatAttachmentChip
        attachment={{ id: '3', name: 'brief.pdf', kind: 'pdf' }}
        onRemove={() => {}}
        compact
      />
    </div>
  ),
};
