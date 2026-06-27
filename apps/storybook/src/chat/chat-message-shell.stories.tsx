import type { Meta, StoryObj } from '@storybook/react-vite';

import { ChatMessageShell } from '@zeroxsolutions/ui/chat-message-shell';

const meta: Meta<typeof ChatMessageShell> = {
  title: 'Chat/MessageShell',
  component: ChatMessageShell,
};
export default meta;

type Story = StoryObj<typeof ChatMessageShell>;

export const Conversation: Story = {
  render: () => (
    <div className="flex w-[28rem] flex-col gap-4">
      <ChatMessageShell role="user">
        Design a login page for a coffee brand.
      </ChatMessageShell>
      <ChatMessageShell
        role="assistant"
        showAgentLabel
        agent={{ name: 'Vincent', color: '#7c3aed' }}
      >
        On it — a warm two-column layout with the form on the right.
      </ChatMessageShell>
    </div>
  ),
};

export const Streaming: Story = {
  render: () => (
    <div className="w-[28rem]">
      <ChatMessageShell
        role="assistant"
        showAgentLabel
        streaming
        agent={{ name: 'Leonardo', color: '#0ea5e9' }}
      >
        Sketching the hero section…
      </ChatMessageShell>
    </div>
  ),
};
