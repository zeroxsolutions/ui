import {
  Children,
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import { MessageContext, useMessage } from '../lib/message-context';
import { cn } from '../lib/utils';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes, and
// `cn-<slot>@<state>` for the classes behind that state, such as `@slot=message-footer` on the avatar of a
// message with a footer; the registry build replaces each with the classes translated for the target engine.

/** What the parts of a Message read from it besides its side: whether it holds a footer or a ghost Bubble. */
const MessagePartsContext = createContext<{
  holdsFooter: boolean;
  holdsGhost: boolean;
  /** Counts a mounted MessageFooter in, `1`, or out, `-1`. */
  countFooter: (change: 1 | -1) => void;
}>({ holdsFooter: false, holdsGhost: false, countFooter: () => undefined });

/** A run of consecutive messages from one sender. */
function MessageGroup({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('min-w-0 flex-col cn-message-group', className)} {...props} />;
}

type MessageProps = ComponentProps<typeof View> & {
  /** The side of the conversation the message sits on; `end` puts the avatar on the other side. */
  align?: 'start' | 'end';
};

/**
 * One message in a conversation: a MessageAvatar beside a MessageContent, which holds an optional
 * MessageHeader, the message's Bubbles or attachments, and an optional MessageFooter.
 */
function Message({ className, align = 'start', ...props }: MessageProps): ReactNode {
  const [footers, setFooters] = useState(0);
  const [ghosts, setGhosts] = useState(0);
  const countFooter = useCallback((change: 1 | -1) => setFooters((count) => count + change), []);
  const countGhost = useCallback((change: 1 | -1) => setGhosts((count) => count + change), []);
  const message = useMemo(() => ({ align, countGhost }), [align, countGhost]);
  const parts = useMemo(
    () => ({ holdsFooter: footers > 0, holdsGhost: ghosts > 0, countFooter }),
    [footers, ghosts, countFooter],
  );

  return (
    <MessageContext.Provider value={message}>
      <MessagePartsContext.Provider value={parts}>
        <TextClassContext.Provider value="cn-message/text">
          <View
            className={cn(
              'relative w-full min-w-0 flex-row cn-message',
              align === 'end' && 'flex-row-reverse',
              className,
            )}
            {...props}
          />
        </TextClassContext.Provider>
      </MessagePartsContext.Provider>
    </MessageContext.Provider>
  );
}

/**
 * The round picture beside a message, at its bottom; while the message has a footer, lifted level with the
 * message's last bubble rather than the footer. Put an Avatar in it.
 */
function MessageAvatar({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  const { holdsFooter } = useContext(MessagePartsContext);
  return (
    <View
      className={cn(
        'shrink-0 items-center justify-center self-end overflow-hidden rounded-full bg-muted cn-message-avatar',
        holdsFooter && 'cn-message-avatar@slot=message-footer',
        className,
      )}
      {...props}
    />
  );
}

/** The header, bubbles and footer of a message, in the width its avatar leaves, at the message's side. */
function MessageContent({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  const { align } = useMessage();
  return (
    <View
      className={cn('min-w-0 flex-1 flex-col cn-message-content', align === 'end' && 'items-end', className)}
      {...props}
    />
  );
}

/** `children` set in one Text when they are only text, which a View cannot hold bare. */
function asText(children: ReactNode): ReactNode {
  const parts = Children.toArray(children);
  return parts.length > 0 && parts.every((part) => typeof part === 'string' || typeof part === 'number') ? (
    <Text>{children}</Text>
  ) : (
    children
  );
}

/** A line above the message, such as the sender's name, small and muted. Text given straight to it is set in a Text. */
function MessageHeader({ className, children, ...props }: ComponentProps<typeof View>): ReactNode {
  const { holdsGhost } = useContext(MessagePartsContext);
  return (
    <TextClassContext.Provider value="cn-message-header/text">
      <View
        className={cn(
          'min-w-0 max-w-full flex-row items-center cn-message-header',
          holdsGhost && 'cn-message-header@variant=ghost',
          className,
        )}
        {...props}
      >
        {asText(children)}
      </View>
    </TextClassContext.Provider>
  );
}

/**
 * A line below the message, such as its status or actions, small and muted, at the message's side. Text given
 * straight to it is set in a Text.
 */
function MessageFooter({ className, children, ...props }: ComponentProps<typeof View>): ReactNode {
  const { align } = useMessage();
  const { holdsGhost, countFooter } = useContext(MessagePartsContext);

  // Before paint, so the avatar beside a footer is never drawn at the bottom first.
  useLayoutEffect(() => {
    countFooter(1);
    return () => countFooter(-1);
  }, [countFooter]);

  return (
    <TextClassContext.Provider value="cn-message-footer/text">
      <View
        className={cn(
          'min-w-0 max-w-full flex-row items-center cn-message-footer',
          holdsGhost && 'cn-message-footer@variant=ghost',
          align === 'end' && 'justify-end',
          className,
        )}
        {...props}
      >
        {asText(children)}
      </View>
    </TextClassContext.Provider>
  );
}

export { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader };
export type { MessageProps };
