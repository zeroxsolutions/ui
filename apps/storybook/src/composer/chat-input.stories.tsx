import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Code2, Image as ImageIcon } from 'lucide-react';

import { ChatInput } from '@zeroxsolutions/editor/composer/chat-input';
import { ChatMessageView } from '@zeroxsolutions/editor/composer/chat-message-view';
import {
  commandTrigger,
  mentionTrigger,
} from '@zeroxsolutions/editor/composer/composer-triggers';
import type {
  ChatCommand,
  ChatMessagePayload,
  ChatPerson,
} from '@zeroxsolutions/editor/composer/composer-types';
import { ChatMessageShell } from '@zeroxsolutions/ui/components/chat/chat-message-shell';

/**
 * `ChatInput` is the contentEditable chat composer from `@zeroxsolutions/editor`.
 * Type `@` for a caret-anchored mention menu (selecting inserts a resolved
 * `{ id, label }` pill), or `/` at the very start for a command menu. A command
 * commits (Tab / Enter, or typing its full slug + space) into an inline `/name`
 * token that stays in the line; Backspace on it re-opens it as editable text.
 * `Enter` submits the structured payload and clears; `Shift+Enter` inserts a
 * newline. The people and command lists are caller-supplied; here each submit is
 * rendered back through `ChatMessageView` inside the design-system
 * `ChatMessageShell`.
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

// The trigger registry: adding a trigger is adding a `ComposerTrigger` here.
const triggers = [mentionTrigger({ people }), commandTrigger(commands)];

function Playground() {
  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  return (
    <div className="flex w-[32rem] flex-col gap-4">
      {messages.length > 0 && (
        <div className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <ChatMessageShell key={index} role="user">
              <ChatMessageView message={message} />
            </ChatMessageShell>
          ))}
        </div>
      )}
      <ChatInput
        triggers={triggers}
        placeholder="Message… (@ to mention, / for a command)"
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

/** The full composer: `@` mention menu, `/` command mode, and each submitted
 *  payload rendered back through `ChatMessageView`. */
export const Playground_: Story = {
  name: 'Playground',
  render: () => <Playground />,
};

/** Just the input, empty — shows the placeholder and the send affordance. */
export const Empty: Story = {
  render: () => (
    <div className="w-[32rem]">
      <ChatInput
        triggers={triggers}
        placeholder="Ask anything… (@ to mention, / for a command)"
        onSubmit={() => {}}
      />
    </div>
  ),
};
