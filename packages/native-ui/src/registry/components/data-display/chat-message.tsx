import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../../lib/utils';
import { useDirectionSides } from '../../ui/direction';
import { Message } from '../../ui/message';

/** Whether the row is still streaming, which the web reads off the row's `data-streaming` through a group selector. */
const ChatMessageStreamingContext = createContext(false);

/** How far the accent sits before the row's leading edge, the web's `-start-3`. */
const ACCENT_OUTSET = -12;

type ChatMessageProps = ComponentProps<typeof Message> & {
  /** While true, the row's `ChatMessageAccent` shows. */
  streaming?: boolean;
};

/**
 * One chat message row: Message, marked as streaming while its text is still arriving. Compose the row from
 * Message's parts, a muted Bubble for the person and a ghost one for the agent, and a `ChatMessageAccent` for the
 * streaming line:
 *
 *   <ChatMessage align="end">
 *     <MessageContent>
 *       <Bubble variant="muted"><BubbleContent>Hello</BubbleContent></Bubble>
 *     </MessageContent>
 *   </ChatMessage>
 *   <ChatMessage streaming>
 *     <ChatMessageAccent className="bg-chart-2" />
 *     <MessageContent>
 *       <MessageHeader>{agent.name}</MessageHeader>
 *       <Bubble variant="ghost"><BubbleContent>{text}</BubbleContent></Bubble>
 *     </MessageContent>
 *   </ChatMessage>
 */
function ChatMessage({ streaming = false, ...props }: ChatMessageProps): ReactNode {
  return (
    <ChatMessageStreamingContext.Provider value={streaming}>
      <Message {...props} />
    </ChatMessageStreamingContext.Provider>
  );
}

/**
 * The line beside the row's leading edge, drawn only while the row streams and hidden from a screen reader. It
 * is painted in the primary colour, or in the colour a `className` or `style` gives it, such as the agent's. It
 * sits outside the row, in the space before its leading edge, so the row keeps Message's own padding and the
 * list around it needs room there.
 */
function ChatMessageAccent({ className, style, ...props }: ComponentProps<typeof View>): ReactNode {
  const streaming = useContext(ChatMessageStreamingContext);
  const sides = useDirectionSides();
  if (!streaming) return null;
  return (
    <View
      aria-hidden
      className={cn('bg-primary absolute inset-y-0 w-0.5', className)}
      style={[{ [sides.start]: ACCENT_OUTSET }, style]}
      {...props}
    />
  );
}

export { ChatMessage, ChatMessageAccent };
export type { ChatMessageProps };
