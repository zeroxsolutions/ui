import type { Meta, StoryObj } from '@storybook/react-vite';

import { ChatMessageView } from '@zeroxsolutions/editor/composer/chat-message-view';
import type { ChatMessagePayload } from '@zeroxsolutions/editor/composer/composer-types';
import type { DocJSON, NodeJSON } from '@zeroxsolutions/editor/document/core/index';
import { ChatMessageShell } from '@zeroxsolutions/ui/components/chat/chat-message-shell';

/**
 * `ChatMessageView` is the read-only render of a submitted composer payload. It
 * renders the payload's canonical `doc` through the **same** codecs the input
 * uses (one shared render path, so the pills can't drift): inline `@` mentions
 * and the leading `/command` render in place, not as a separate badge. It
 * instantiates no editing engine, so it renders server-side; here each message
 * is placed inside the design-system `ChatMessageShell` user bubble.
 */
const para = (...inline: NodeJSON[]): DocJSON => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: inline }],
});

const plain: ChatMessagePayload = {
  text: 'Can you take a look at the hero section?',
  tokens: {},
  doc: para({ type: 'text', text: 'Can you take a look at the hero section?' }),
};

const withMention: ChatMessagePayload = {
  text: 'Nice work @Ada Lovelace - ship it.',
  tokens: { mention: [{ id: 'u1', label: 'Ada Lovelace' }] },
  doc: para(
    { type: 'text', text: 'Nice work ' },
    { type: 'mention', attrs: { id: 'u1', label: 'Ada Lovelace' } },
    { type: 'text', text: ' - ship it.' },
  ),
};

const withCommand: ChatMessagePayload = {
  text: '/image-gen a portrait of @Grace Hopper at her desk',
  tokens: {
    command: [{ id: 'image', label: 'Image', name: 'image-gen' }],
    mention: [{ id: 'u2', label: 'Grace Hopper' }],
  },
  doc: para(
    { type: 'command', attrs: { id: 'image', label: 'Image', slug: 'image-gen' } },
    { type: 'text', text: 'a portrait of ' },
    { type: 'mention', attrs: { id: 'u2', label: 'Grace Hopper' } },
    { type: 'text', text: ' at her desk' },
  ),
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

/** A single command message, standalone (no shell) - the leading inline `/name`
 *  pill plus the inline mention pill. */
export const CommandMessage: Story = {
  render: () => (
    <div className="w-[32rem]">
      <ChatMessageView message={withCommand} />
    </div>
  ),
};
