import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@chiselart/ui/conversation';

/** A message bubble stand-in — the story exercises the scroll surface, not the
 *  real chat bubble. */
function Bubble({
  role,
  children,
}: {
  role: 'user' | 'assistant';
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        role === 'user'
          ? 'ml-auto max-w-[80%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground'
          : 'max-w-[80%] rounded-2xl bg-muted px-3 py-2 text-sm'
      }
    >
      {children}
    </div>
  );
}

const meta: Meta<typeof Conversation> = {
  title: 'AI Elements/Conversation',
  component: Conversation,
  // The surface fills its parent (`h-full`); give every story a bounded box so
  // the scroll behaviour is visible.
  decorators: [
    (Story) => (
      <div className="h-96 w-[28rem] overflow-hidden rounded-lg border bg-background">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Conversation>;

export const Default: Story = {
  render: () => (
    <Conversation>
      <ConversationContent>
        {Array.from({ length: 12 }).map((_, i) => (
          <Bubble key={i} role={i % 2 === 0 ? 'assistant' : 'user'}>
            Message {i + 1} — the gap between bubbles comes from
            ConversationContent's flex column.
          </Bubble>
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  ),
};

/**
 * §F regression guard: a message with a long unbreakable token must clamp to
 * the panel width (scroll inside its own bubble) — it must NOT widen the
 * surface, and the inter-message gap must survive. This is what the removed
 * `[&>…viewport>div]:block!` override used to break (it forced
 * ConversationContent from flex to block, collapsing the gap).
 */
export const WideContent: Story = {
  name: 'Wide content (gap + width clamp)',
  render: () => (
    <Conversation>
      <ConversationContent>
        <Bubble role="assistant">Short reply above the wide one.</Bubble>
        <Bubble role="assistant">
          <pre className="overflow-x-auto text-xs">
            const veryLongIdentifier =
            &quot;aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&quot;;
          </pre>
        </Bubble>
        <Bubble role="user">And a short reply below.</Bubble>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  ),
};
