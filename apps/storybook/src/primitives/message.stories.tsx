import type { Meta, StoryObj } from '@storybook/react-vite';

import { Bubble, BubbleContent } from '@zeroxsolutions/ui/bubble';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from '@zeroxsolutions/ui/message';

/**
 * `Message` is a chat message row that lays an avatar beside its content and
 * flips horizontally via `align="start" | "end"` to separate incoming from
 * outgoing messages. Compose it from `MessageAvatar`, `MessageContent`,
 * `MessageHeader`, and `MessageFooter`, then stack rows inside a `MessageGroup`.
 * `MessageContent` usually wraps a `Bubble` (from `@zeroxsolutions/ui/bubble`)
 * to render the speech-bubble surface, which inherits the row's alignment.
 */
const meta: Meta<typeof Message> = {
  title: 'Primitives/Message',
  component: Message,
};
export default meta;

type Story = StoryObj<typeof Message>;

/**
 * A realistic two-party thread: alternating `align="start"` (Maya, incoming)
 * and `align="end"` (Sam, outgoing) rows in a `MessageGroup`, each with an
 * avatar, a name/time header, a content bubble, and a delivery footer.
 */
export const Conversation: Story = {
  render: () => (
    <MessageGroup className="w-96">
      <Message align="start">
        <MessageAvatar className="size-8 text-xs">MA</MessageAvatar>
        <MessageContent>
          <MessageHeader>
            <span>Maya</span>
            <span className="ml-2 font-normal">9:24 AM</span>
          </MessageHeader>
          <Bubble variant="muted">
            <BubbleContent>
              Hey! Are we still on for the design review at noon?
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>

      <Message align="end">
        <MessageAvatar className="size-8 text-xs">SA</MessageAvatar>
        <MessageContent>
          <MessageHeader>
            <span>Sam</span>
            <span className="ml-2 font-normal">9:26 AM</span>
          </MessageHeader>
          <Bubble>
            <BubbleContent>
              Yep, noon works. I&apos;ll bring the latest mockups.
            </BubbleContent>
          </Bubble>
          <MessageFooter>Delivered</MessageFooter>
        </MessageContent>
      </Message>

      <Message align="start">
        <MessageAvatar className="size-8 text-xs">MA</MessageAvatar>
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>Perfect — see you then.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageGroup>
  ),
};

/**
 * A single `align="start"` row: the avatar sits on the left and the muted bubble
 * hugs the leading edge — the default layout for received messages.
 */
export const Incoming: Story = {
  render: () => (
    <Message align="start" className="w-96">
      <MessageAvatar className="size-8 text-xs">MA</MessageAvatar>
      <MessageContent>
        <Bubble variant="muted">
          <BubbleContent>Can you share the updated spec?</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  ),
};

/**
 * A single `align="end"` row: the row reverses so the avatar moves to the right
 * and the primary bubble hugs the trailing edge — the layout for sent messages.
 * The `MessageFooter` reports delivery state and aligns to the end automatically.
 */
export const Outgoing: Story = {
  render: () => (
    <Message align="end" className="w-96">
      <MessageAvatar className="size-8 text-xs">SA</MessageAvatar>
      <MessageContent>
        <Bubble>
          <BubbleContent>
            Sent it over just now — check your inbox.
          </BubbleContent>
        </Bubble>
        <MessageFooter>Delivered · 9:31 AM</MessageFooter>
      </MessageContent>
    </Message>
  ),
};

/**
 * `MessageHeader` renders a muted name + timestamp line above the bubble,
 * useful as the first message in a sender's run before subsequent bubbles omit
 * the repeated header.
 */
export const WithHeader: Story = {
  render: () => (
    <Message align="start" className="w-96">
      <MessageAvatar className="size-8 text-xs">MA</MessageAvatar>
      <MessageContent>
        <MessageHeader>
          <span>Maya</span>
          <span className="ml-2 font-normal">2:05 PM</span>
        </MessageHeader>
        <Bubble variant="muted">
          <BubbleContent>I left a few notes on the prototype.</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  ),
};

/**
 * Several consecutive bubbles from one sender stacked inside a single
 * `MessageContent`. The avatar pins to the bottom of the run (`self-end`) so it
 * sits beside the last bubble rather than the first.
 */
export const StackedBubbles: Story = {
  render: () => (
    <Message align="end" className="w-96">
      <MessageAvatar className="size-8 text-xs">SA</MessageAvatar>
      <MessageContent>
        <Bubble>
          <BubbleContent>One more thing —</BubbleContent>
        </Bubble>
        <Bubble>
          <BubbleContent>can we push the call to 1pm?</BubbleContent>
        </Bubble>
        <Bubble>
          <BubbleContent>Something came up this morning.</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  ),
};
