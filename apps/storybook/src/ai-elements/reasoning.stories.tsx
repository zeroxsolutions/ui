import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@chiselart/ui/reasoning';

const THOUGHT = `Let me work through this.

1. The user wants a landing page.
2. I'll start with the hero, then the feature grid.

\`\`\`ts
const sections = ['hero', 'features', 'cta'];
\`\`\`

That ordering keeps the primary action above the fold.`;

const meta: Meta<typeof Reasoning> = {
  title: 'AI Elements/Reasoning',
  component: Reasoning,
};
export default meta;

type Story = StoryObj<typeof Reasoning>;

export const Streaming: Story = {
  render: () => (
    <div className="max-w-xl">
      <Reasoning isStreaming>
        <ReasoningTrigger />
        <ReasoningContent>{THOUGHT}</ReasoningContent>
      </Reasoning>
    </div>
  ),
};

export const Settled: Story = {
  name: 'Settled (open)',
  render: () => (
    <div className="max-w-xl">
      <Reasoning defaultOpen>
        <ReasoningTrigger />
        <ReasoningContent>{THOUGHT}</ReasoningContent>
      </Reasoning>
    </div>
  ),
};
