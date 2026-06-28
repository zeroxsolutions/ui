import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@zeroxsolutions/ui/components/ui/message-scroller';

/**
 * `MessageScroller` is a compound, auto-sticking scroll viewport for chat-style
 * message lists. `MessageScrollerProvider` owns the scroll state (auto-scroll,
 * default position, edge thresholds); `MessageScroller` is the relative root that
 * frames `MessageScrollerViewport` (the scrollable region), `MessageScrollerContent`
 * (the flex column of messages), and one `MessageScrollerItem` per message.
 * `MessageScrollerButton` is an absolutely positioned scroll-to-end/start control
 * that auto-hides once the viewport is pinned to that edge. The root fills its
 * parent, so wrap it in a fixed-height container to let the viewport overflow.
 */
const meta: Meta<typeof MessageScroller> = {
  title: 'Primitives/MessageScroller',
  component: MessageScroller,
  decorators: [
    (Story) => (
      <div className="h-80 w-96 overflow-hidden rounded-lg border">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof MessageScroller>;

type ChatMessage = {
  id: string;
  author: 'them' | 'me';
  name: string;
  text: string;
};

const conversation: ChatMessage[] = [
  {
    id: 'm1',
    author: 'them',
    name: 'Riya',
    text: 'Morning! Did the nightly build finish?',
  },
  { id: 'm2', author: 'me', name: 'You', text: 'Yep, green across the board.' },
  {
    id: 'm3',
    author: 'them',
    name: 'Riya',
    text: 'Nice. Any flaky tests this time?',
  },
  {
    id: 'm4',
    author: 'me',
    name: 'You',
    text: 'Two in the upload suite, but they passed on retry.',
  },
  {
    id: 'm5',
    author: 'them',
    name: 'Riya',
    text: 'Let me know if it keeps happening.',
  },
  {
    id: 'm6',
    author: 'me',
    name: 'You',
    text: 'Will do. I opened a ticket to track it.',
  },
  {
    id: 'm7',
    author: 'them',
    name: 'Theo',
    text: 'Can we ship the search fix today?',
  },
  {
    id: 'm8',
    author: 'me',
    name: 'You',
    text: 'Almost there, just waiting on a review.',
  },
  {
    id: 'm9',
    author: 'them',
    name: 'Theo',
    text: 'I can take a look this afternoon.',
  },
  {
    id: 'm10',
    author: 'me',
    name: 'You',
    text: 'Perfect, I will tag you on the PR.',
  },
  {
    id: 'm11',
    author: 'them',
    name: 'Riya',
    text: 'Reminder: standup moves to 10:30 tomorrow.',
  },
  {
    id: 'm12',
    author: 'me',
    name: 'You',
    text: 'Noted, thanks for the heads up.',
  },
  {
    id: 'm13',
    author: 'them',
    name: 'Theo',
    text: 'Review done, left a couple of small comments.',
  },
  {
    id: 'm14',
    author: 'me',
    name: 'You',
    text: 'Addressed them and pushed. Merging now.',
  },
  {
    id: 'm15',
    author: 'them',
    name: 'Riya',
    text: 'And we are live. Nice work everyone.',
  },
];

function MessageRow({
  message,
  scrollAnchor,
}: {
  message: ChatMessage;
  scrollAnchor?: boolean;
}) {
  const mine = message.author === 'me';
  return (
    <MessageScrollerItem
      messageId={message.id}
      scrollAnchor={scrollAnchor}
      className={`flex flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}
    >
      <span className="px-1 text-xs text-muted-foreground">{message.name}</span>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
          mine
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        }`}
      >
        {message.text}
      </div>
    </MessageScrollerItem>
  );
}

/**
 * The default chat layout: a long thread that overflows the fixed-height
 * container and starts pinned to the latest message (`defaultScrollPosition="end"`
 * with `autoScroll`). The scroll-to-end `MessageScrollerButton` stays hidden while
 * the viewport sits at the bottom and fades in once you scroll up.
 */
export const Default: Story = {
  render: () => (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <MessageScroller>
        <MessageScrollerViewport className="px-4 py-3">
          <MessageScrollerContent>
            {conversation.map((message, index) => (
              <MessageRow
                key={message.id}
                message={message}
                scrollAnchor={index === conversation.length - 1}
              />
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  ),
};

/**
 * Opens scrolled to the top of the thread (`defaultScrollPosition="start"`,
 * auto-scroll disabled). Because the viewport is not at the end, the
 * scroll-to-end button is immediately active so the reader can jump down.
 */
export const StartAtTop: Story = {
  render: () => (
    <MessageScrollerProvider autoScroll={false} defaultScrollPosition="start">
      <MessageScroller>
        <MessageScrollerViewport className="px-4 py-3">
          <MessageScrollerContent>
            {conversation.map((message) => (
              <MessageRow key={message.id} message={message} />
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  ),
};

/**
 * Pairs a scroll-to-start control (`direction="start"`, pinned to the top edge)
 * with the default scroll-to-end button, so the thread can be jumped to either
 * boundary. Each button auto-hides whenever the viewport already rests on its edge.
 */
export const DualScrollControls: Story = {
  render: () => (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <MessageScroller>
        <MessageScrollerViewport className="px-4 py-3">
          <MessageScrollerContent>
            {conversation.map((message, index) => (
              <MessageRow
                key={message.id}
                message={message}
                scrollAnchor={index === conversation.length - 1}
              />
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton direction="start" />
        <MessageScrollerButton direction="end" />
      </MessageScroller>
    </MessageScrollerProvider>
  ),
};

/**
 * A short thread that fits entirely within the viewport. With nothing to
 * overflow, the scroll-to-end button never becomes active, showing the
 * idle/hidden state of `MessageScrollerButton`.
 */
export const ShortThread: Story = {
  render: () => (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <MessageScroller>
        <MessageScrollerViewport className="px-4 py-3">
          <MessageScrollerContent>
            {conversation.slice(0, 3).map((message, index, items) => (
              <MessageRow
                key={message.id}
                message={message}
                scrollAnchor={index === items.length - 1}
              />
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  ),
};
