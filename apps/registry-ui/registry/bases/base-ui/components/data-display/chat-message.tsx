import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Message } from '@/registry/bases/base-ui/ui/message';

interface ChatMessageProps extends ComponentProps<typeof Message> {
  /** While true, the row carries `data-streaming`, which shows its `ChatMessageAccent`. */
  streaming?: boolean;
}

/**
 * ChatMessage - one chat message row: upstream `Message`, marked with `data-streaming` while its text
 * is still arriving. The consumer composes the row from upstream parts, a muted `Bubble` for the user
 * and a ghost one for the agent, and a `ChatMessageAccent` for the streaming line:
 *
 *   <ChatMessage align="end">
 *     <MessageContent>
 *       <Bubble variant="muted"><BubbleContent>Hello</BubbleContent></Bubble>
 *     </MessageContent>
 *   </ChatMessage>
 *   <ChatMessage streaming style={{ '--chat-message-accent': agent.color } as CSSProperties}>
 *     <ChatMessageAccent />
 *     <MessageContent>
 *       <MessageHeader>{agent.name}</MessageHeader>
 *       <Bubble variant="ghost"><BubbleContent>{text}</BubbleContent></Bubble>
 *     </MessageContent>
 *   </ChatMessage>
 */
function ChatMessage({ streaming = false, className, ...props }: ChatMessageProps): ReactNode {
  return (
    <Message data-streaming={streaming ? '' : undefined} className={cn('group/chat-message', className)} {...props} />
  );
}

/**
 * The line beside the row's leading edge, shown only while the row streams. It is painted in
 * `--chat-message-accent` (any CSS colour, such as the agent's, set on the row), or `--primary` when
 * that is unset. It sits outside the row, in the space before its leading edge, so the row keeps
 * upstream's own padding and the list around it needs room there.
 */
function ChatMessageAccent({ className, ...props }: ComponentProps<'span'>): ReactNode {
  return (
    <span
      aria-hidden
      className={cn(
        'absolute inset-y-0 -start-3 hidden w-0.5 bg-(--chat-message-accent,var(--color-primary)) group-data-streaming/chat-message:block',
        className,
      )}
      {...props}
    />
  );
}

export { ChatMessage, ChatMessageAccent };
export type { ChatMessageProps };
