import type { ComponentProps, ReactNode } from 'react';

import { Message } from '@/registry/bases/base-ui/ui/message';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface ChatMessageProps extends ComponentProps<typeof Message> {
  /**
   * While true, the row carries `data-streaming` and a leading-edge line in
   * `border-primary`; `style.borderInlineStartColor` recolours it, for
   * example to the agent's colour.
   */
  streaming?: boolean;
}

/**
 * ChatMessage - one chat message row: upstream `Message` plus a leading-edge
 * accent while the text is still arriving. The consumer composes the row from
 * upstream parts, a muted `Bubble` for the user and a ghost one for the agent:
 *
 *   <ChatMessage align="end">
 *     <MessageContent>
 *       <Bubble variant="muted"><BubbleContent>Hello</BubbleContent></Bubble>
 *     </MessageContent>
 *   </ChatMessage>
 *   <ChatMessage streaming style={{ borderInlineStartColor: agent.color }}>
 *     <MessageContent>
 *       <MessageHeader>{agent.name}</MessageHeader>
 *       <Bubble variant="ghost"><BubbleContent>{text}</BubbleContent></Bubble>
 *     </MessageContent>
 *   </ChatMessage>
 */
function ChatMessage({ streaming = false, className, ...props }: ChatMessageProps): ReactNode {
  return (
    <Message
      data-slot="chat-message"
      data-streaming={streaming ? '' : undefined}
      className={cn(
        'data-streaming:border-primary data-streaming:-ms-3 data-streaming:border-s-2 data-streaming:ps-3',
        className,
      )}
      {...props}
    />
  );
}

export { ChatMessage };
export type { ChatMessageProps };
