import type { ReactNode } from 'react';
import { View } from 'react-native';

import { ChatMessage, ChatMessageAccent } from '@/components/data-display/chat-message';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { MessageContent, MessageHeader } from '@/components/ui/message';

/** A person's bubble and the assistant's reply, still streaming. */
function ChatMessageDemo(): ReactNode {
  return (
    <View className="w-full gap-3 px-3">
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
    </View>
  );
}

export { ChatMessageDemo };
