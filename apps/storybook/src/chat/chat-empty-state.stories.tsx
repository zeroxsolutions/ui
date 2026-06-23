import type { Meta, StoryObj } from '@storybook/react-vite';
import { Image, MessageSquare, Sparkles, Workflow } from 'lucide-react';

import { ChatEmptyState } from '@chiselart/ui/chat-empty-state';

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
