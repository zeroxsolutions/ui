import type { Meta, StoryObj } from '@storybook/react-vite';

import { ChatMessageView } from '@zeroxsolutions/editor/composer/chat-message-view';
import type { ChatMessagePayload } from '@zeroxsolutions/editor/composer/composer-types';
import { ChatMessageShell } from '@zeroxsolutions/ui/components/chat/chat-message-shell';

/**
 * `ChatMessageView` is the read-only render of a submitted composer payload. It
 * renders every pill — inline `@` mentions and the leading `/command` — through
 * the **same** codecs the input uses (one shared render path, so the pills can't
 * drift). The command is an inline `/name` token in `segments`, so it renders
 * in place, not as a separate badge. It instantiates no editing engine, so it
 * renders server-side; here each message is placed inside the design-system
 * `ChatMessageShell` user bubble.
 */
const plain: ChatMessagePayload = {
  command: null,
  mentions: [],
  segments: [{ text: 'Can you take a look at the hero section?' }],
};

const withMention: ChatMessagePayload = {
  command: null,
  mentions: [{ id: 'u1', label: 'Ada Lovelace' }],
  segments: [
    { text: 'Nice work ' },
    { mention: { id: 'u1', label: 'Ada Lovelace' } },
    { text: ' - ship it.' },
  ],
};

const withCommand: ChatMessagePayload = {
  command: { id: 'image', label: 'Image', name: 'image-gen' },
  mentions: [{ id: 'u2', label: 'Grace Hopper' }],
  segments: [
    { command: { id: 'image', label: 'Image', name: 'image-gen' } },
    { text: 'a portrait of ' },
    { mention: { id: 'u2', label: 'Grace Hopper' } },
    { text: ' at her desk' },
  ],
};

const meta: Meta<typeof ChatMessageView> = {
  title: 'Composer/ChatMessageView',
  component: ChatMessageView,
};
export default meta;

type Story = StoryObj<typeof ChatMessageView>;

/** Three submitted messages: plain text, an inline mention pill, and a leading
 *  inline `/command` token with a mention - each in a user bubble. */
export const Messages: Story = {
  render: () => (
    <div className="flex w-[32rem] flex-col gap-3">
      <ChatMessageShell role="user">
        <ChatMessageView message={plain} />
      </ChatMessageShell>
      <ChatMessageShell role="user">
        <ChatMessageView message={withMention} />
      </ChatMessageShell>
      <ChatMessageShell role="user">
        <ChatMessageView message={withCommand} />
      </ChatMessageShell>
    </div>
  ),
};

/** A single command message, standalone (no shell) — the leading `Badge` plus the
 *  inline mention pill. */
export const CommandMessage: Story = {
  render: () => (
    <div className="w-[32rem]">
      <ChatMessageView message={withCommand} />
    </div>
  ),
};
