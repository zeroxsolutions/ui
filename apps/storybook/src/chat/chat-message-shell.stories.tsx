import type { Meta, StoryObj } from '@storybook/react-vite';

import { ChatMessageShell } from '@zeroxsolutions/ui/components/chat/chat-message-shell';

/**
 * `ChatMessageShell` wraps a single message row and is agnostic to how the body
 * is rendered. A `user` role yields a soft right-pinned bubble capped at 85%
 * width; any other role renders full-width prose with an optional agent identity
 * row (color dot + name) and a leading-edge accent while streaming. The host
 * supplies the body as `children` and decides when to show the identity row.
 */
const meta: Meta<typeof ChatMessageShell> = {
  title: 'Chat/MessageShell',
  component: ChatMessageShell,
};
export default meta;

type Story = StoryObj<typeof ChatMessageShell>;

/** A user message paired with a labeled assistant reply, contrasting the right-pinned bubble with full-width prose. */
export const Conversation: Story = {
  render: () => (
    <div className="flex w-[28rem] flex-col gap-4">
      <ChatMessageShell role="user">
        Design a login page for a coffee brand.
      </ChatMessageShell>
      <ChatMessageShell
        role="assistant"
        showAgentLabel
        agent={{ name: 'Assistant', color: '#7c3aed' }}
      >
        On it — a warm two-column layout with the form on the right.
      </ChatMessageShell>
    </div>
  ),
};

/** Assistant message mid-stream: the identity row plus the agent-colored leading-edge accent. */
export const Streaming: Story = {
  render: () => (
    <div className="w-[28rem]">
      <ChatMessageShell
        role="assistant"
        showAgentLabel
        streaming
        agent={{ name: 'Reviewer', color: '#0ea5e9' }}
      >
        Sketching the hero section…
      </ChatMessageShell>
    </div>
  ),
};
