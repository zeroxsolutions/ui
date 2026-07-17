import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Code2, Image as ImageIcon } from 'lucide-react';

import { ChatInput } from '@zeroxsolutions/editor/composer/chat-input';
import { ChatMessageView } from '@zeroxsolutions/editor/composer/chat-message-view';
import {
  channelTrigger,
  commandTrigger,
  mentionTrigger,
} from '@zeroxsolutions/editor/composer/composer-triggers';
import type {
  ChatChannel,
  ChatCommand,
  ChatMessagePayload,
  ChatPerson,
} from '@zeroxsolutions/editor/composer/composer-types';
import { ChatMessageShell } from '@zeroxsolutions/ui/components/chat/chat-message-shell';

/**
 * `ChatInput` is the contentEditable chat composer from `@zeroxsolutions/editor`,
 * driven by a **trigger registry**: `@` mention and `#` channel (references,
 * insertable anywhere) and `/` command (an invocation, start-only). A command
 * commits (Tab / Enter, or typing its full slug + space) into an inline `/name`
 * token that stays in the line; Backspace on it re-opens it as editable text.
 * `Enter` submits the structured payload and clears; `Shift+Enter` inserts a
 * newline. Each trigger is ONE `ComposerTrigger` in `triggers` - `#channel`
 * reuses the same generic menu, node/codec factory, and payload mapping as the
 * other two, which is the registry's whole point. The lists are caller-supplied;
 * each submit is rendered back through `ChatMessageView` on the same registry,
 * inside the design-system `ChatMessageShell`.
 */
const people: ChatPerson[] = [
  { id: 'u1', label: 'Ada Lovelace', description: '@ada' },
  { id: 'u2', label: 'Grace Hopper', description: '@grace' },
  { id: 'u3', label: 'Alan Turing', description: '@alan' },
  { id: 'u4', label: 'Katherine Johnson', description: '@katherine' },
];

// A realistic mix: only some commands carry a menu icon (Image, Code); the rest
// are plain text rows. Each has a `name` slug typed after `/` and shown in the
// committed pill (e.g. `/image-gen`), distinct from its human label.
const commands: ChatCommand[] = [
  { id: 'image', name: 'image-gen', label: 'Image', description: 'Generate an image', icon: <ImageIcon /> },
  { id: 'code', name: 'code', label: 'Code', description: 'Write or explain code', icon: <Code2 /> },
  { id: 'search', name: 'search', label: 'Search', description: 'Search the web' },
  { id: 'summarize', name: 'summarize', label: 'Summarize', description: 'Summarize the conversation' },
  { id: 'translate', name: 'translate', label: 'Translate', description: 'Translate to another language' },
];

const channels: ChatChannel[] = [
  { id: 'c1', label: 'general', description: 'Company-wide announcements' },
  { id: 'c2', label: 'design', description: 'Design crits and specs' },
  { id: 'c3', label: 'engineering', description: 'Builds, reviews, incidents' },
];

// The trigger registry: adding a trigger is adding ONE `ComposerTrigger` here -
// `#channel` needed no new menu, no hand-written node, and no payload change.
const triggers = [
  mentionTrigger({ people }),
  channelTrigger(channels),
  commandTrigger(commands),
];

function Playground() {
  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  return (
    <div className="flex w-[32rem] flex-col gap-4">
      {messages.length > 0 && (
        <div className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <ChatMessageShell key={index} role="user">
              {/* The same registry renders the pills read-only. */}
              <ChatMessageView message={message} triggers={triggers} />
            </ChatMessageShell>
          ))}
        </div>
      )}
      <ChatInput
        triggers={triggers}
        placeholder="Message... (@ mention, # channel, / command)"
        onSubmit={(payload) => setMessages((prev) => [...prev, payload])}
      />
    </div>
  );
}

const meta: Meta<typeof ChatInput> = {
  title: 'Composer/ChatInput',
  component: ChatInput,
};
export default meta;

type Story = StoryObj<typeof ChatInput>;

/** The full composer on three registered triggers: `@` mention, `#` channel, and
 *  `/` command, with each submitted payload rendered back through
 *  `ChatMessageView` on the same registry. */
export const Playground_: Story = {
  name: 'Playground',
  render: () => <Playground />,
};

/** Just the input, empty - shows the placeholder and the send affordance. */
export const Empty: Story = {
  render: () => (
    <div className="w-[32rem]">
      <ChatInput
        triggers={triggers}
        placeholder="Ask anything... (@ mention, # channel, / command)"
        onSubmit={() => {}}
      />
    </div>
  ),
};
