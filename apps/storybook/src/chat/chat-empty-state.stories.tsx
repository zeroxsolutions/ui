import type { Meta, StoryObj } from '@storybook/react-vite';
import { Image, MessageSquare, Sparkles, Workflow } from 'lucide-react';

import { ChatEmptyState } from '@zeroxsolutions/ui/chat-empty-state';

/**
 * `ChatEmptyState` is the starter shown in an empty conversation: a centered
 * header (icon, title, description) above an optional column of clickable
 * suggestion cards. Selecting a card reports its `prompt` through
 * `onSelectPrompt`; with no handler the cards render disabled as a read-only
 * preview. Copy and the suggestion set are consumer-supplied, so wrap it in a
 * sized container to control placement.
 */
const meta: Meta<typeof ChatEmptyState> = {
  title: 'Chat/EmptyState',
  component: ChatEmptyState,
};
export default meta;

type Story = StoryObj<typeof ChatEmptyState>;

const suggestions = [
  {
    icon: MessageSquare,
    title: 'Brainstorm a landing page',
    description: 'Hero, features, pricing',
    prompt: 'Brainstorm a landing page',
  },
  {
    icon: Image,
    title: 'Generate a logo',
    description: 'Flat, two-tone',
    prompt: 'Generate a logo',
  },
  {
    icon: Workflow,
    title: 'Map an onboarding flow',
    prompt: 'Map an onboarding flow',
  },
];

/** Full layout: header plus a column of clickable suggestion cards wired to `onSelectPrompt`. */
export const WithSuggestions: Story = {
  render: () => (
    <div className="w-[28rem]">
      <ChatEmptyState
        icon={<Sparkles />}
        title="Start a conversation"
        description="Pick a starting point or just type."
        suggestions={suggestions}
        onSelectPrompt={() => {}}
      />
    </div>
  ),
};

/** Header-only variant — icon, title, and description with no suggestion list. */
export const HeaderOnly: Story = {
  render: () => (
    <div className="w-[28rem]">
      <ChatEmptyState
        icon={<Sparkles />}
        title="Nothing here yet"
        description="Your messages will appear here."
      />
    </div>
  ),
};
