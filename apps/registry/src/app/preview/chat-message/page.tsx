import { ChatMessage } from '@zeroxsolutions/ui/components/chat/chat-message';

import { ComponentPreview } from '@/components/component-preview';
import {
  CompositionTree,
  DocPage,
  PropsTable,
  UsageCode,
} from '@/components/docs';
import type { CompositionNode, PropEntry } from '@/components/docs';

/** Authored from `ChatMessageProps` - the wrapper's own surface. */
const CHAT_MESSAGE_PROPS: PropEntry[] = [
  {
    name: 'role',
    type: '"user" | "assistant" | "system" | "tool"',
    default: '-',
    description:
      'Sender of the row. "user" renders a right-pinned bubble; other roles render full-width prose.',
  },
  {
    name: 'children',
    type: 'ReactNode',
    default: '-',
    description: 'Message body the host supplies (markdown, tool cards, thinking).',
  },
  {
    name: 'agent',
    type: 'ChatAgentIdentity',
    default: '-',
    description:
      'Owning agent for assistant messages - drives the identity row and the streaming accent colour. Ignored for user/system/tool.',
  },
  {
    name: 'showAgentLabel',
    type: 'boolean',
    default: 'false',
    description:
      'When true, render the agent identity row above the body. The host sets this only on the first message of a contiguous same-agent run.',
  },
  {
    name: 'streaming',
    type: 'boolean',
    default: 'false',
    description:
      'Live-streaming flag - adds a subtle leading-edge accent in the agent colour while text arrives. No-op without agent.color.',
  },
  {
    name: 'className',
    type: 'string',
    default: '-',
    description:
      'Merged into the row wrapper; place and size the message from the consumer container.',
  },
];

/** ChatMessage is a single component, not a compound - the tree is one line. */
const CHAT_MESSAGE_COMPOSITION: CompositionNode = {
  name: 'ChatMessage',
  slot: 'Root',
};

/**
 * Doc page for `ChatMessage`. The Preview keeps the live render
 * `renames.spec.ts` reads (user + assistant rows, both carrying
 * data-slot="chat-message"); this retrofit adds Code/Props/Composition around
 * it without touching the component.
 */
export default function ChatMessagePreviewPage() {
  return (
    <DocPage
      title="ChatMessage"
      description="The wrapper for one chat message row - agnostic to how the body is rendered. User messages pin right as a bubble; assistant messages lay out as full-width prose with an optional agent identity row."
      preview={
        <ComponentPreview>
          <div className="flex w-full flex-col gap-3">
            <ChatMessage role="user">Hello - any updates?</ChatMessage>
            <ChatMessage
              role="assistant"
              showAgentLabel
              agent={{ name: 'Assistant', color: '#6366f1' }}
            >
              Looking now - will report back shortly.
            </ChatMessage>
          </div>
        </ComponentPreview>
      }
      code={
        <UsageCode
          name="chat-message"
          importPath="components/chat/chat-message"
          exportedAs="ChatMessage"
        />
      }
      propsTable={<PropsTable rows={CHAT_MESSAGE_PROPS} />}
      composition={<CompositionTree tree={CHAT_MESSAGE_COMPOSITION} />}
    />
  );
}
