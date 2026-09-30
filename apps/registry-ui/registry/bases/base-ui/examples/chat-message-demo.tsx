import type { ReactNode } from 'react';

import { ChatMessage, ChatMessageAccent } from '@/registry/bases/base-ui/components/data-display/chat-message';
import { Bubble, BubbleContent } from '@/registry/bases/base-ui/ui/bubble';
import { MessageContent, MessageHeader } from '@/registry/bases/base-ui/ui/message';

/** A user bubble and the assistant's reply, still streaming. */
function ChatMessageDemo(): ReactNode {
  return (
    <div className="flex w-full flex-col gap-3">
      <ChatMessage align="end">
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>Hello - any updates?</BubbleContent>
          </Bubble>
        </MessageContent>
      </ChatMessage>
      <ChatMessage streaming>
        <ChatMessageAccent />
        <MessageContent>
          <MessageHeader>Assistant</MessageHeader>
          <Bubble variant="ghost">
            <BubbleContent>Looking now - will report back shortly.</BubbleContent>
          </Bubble>
        </MessageContent>
      </ChatMessage>
    </div>
  );
}

export { ChatMessageDemo };
