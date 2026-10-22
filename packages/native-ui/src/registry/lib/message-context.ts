import { createContext, useContext } from 'react';

/** What a Message tells the parts inside it, and what they tell it back. */
interface MessageContextValue {
  /** The side of the conversation the message sits on; `start` outside any Message. */
  align: 'start' | 'end';
  /** Counts a mounted ghost Bubble in, `1`, or out, `-1`, which the message's header and footer drop their inset for. */
  countGhost: (change: 1 | -1) => void;
}

const MessageContext = createContext<MessageContextValue>({ align: 'start', countGhost: () => undefined });

/** The Message the calling part sits in, or a start-aligned stand-in outside one. */
function useMessage(): MessageContextValue {
  return useContext(MessageContext);
}

export { MessageContext, useMessage };
export type { MessageContextValue };
