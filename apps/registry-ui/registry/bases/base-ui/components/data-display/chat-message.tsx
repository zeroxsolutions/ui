import type { ComponentProps, ReactNode } from 'react';

import { Message } from '@/registry/bases/base-ui/ui/message';

interface ChatMessageProps extends ComponentProps<typeof Message> {
  /** While true, the row carries `data-streaming` and a line in `--primary` beside its leading edge. */
  streaming?: boolean;
  /** Any CSS colour for the streaming line, such as the agent's colour; `--primary` when omitted. */
  accentColor?: string;
}

/**
 * ChatMessage - one chat message row: upstream `Message` plus a line beside its
 * leading edge while the text is still arriving. The consumer composes the row
 * from upstream parts, a muted `Bubble` for the user and a ghost one for the agent:
 *
 *   <ChatMessage align="end">
 *     <MessageContent>
 *       <Bubble variant="muted"><BubbleContent>Hello</BubbleContent></Bubble>
 *     </MessageContent>
 *   </ChatMessage>
 *   <ChatMessage streaming accentColor={agent.color}>
 *     <MessageContent>
 *       <MessageHeader>{agent.name}</MessageHeader>
 *       <Bubble variant="ghost"><BubbleContent>{text}</BubbleContent></Bubble>
 *     </MessageContent>
 *   </ChatMessage>
 *
 * The line sits outside the row, in the space before its leading edge, so the
 * row keeps upstream's own padding and the list around it needs room there.
 */
function ChatMessage({ streaming = false, accentColor, children, ...props }: ChatMessageProps): ReactNode {
  return (
    <Message data-slot="chat-message" data-streaming={streaming ? '' : undefined} {...props}>
      {streaming ? (
        <span
          aria-hidden
          data-slot="chat-message-accent"
          className="bg-primary absolute inset-y-0 -start-3 w-0.5"
          style={accentColor ? { backgroundColor: accentColor } : undefined}
        />
      ) : null}
      {children}
    </Message>
  );
}

export { ChatMessage };
export type { ChatMessageProps };
