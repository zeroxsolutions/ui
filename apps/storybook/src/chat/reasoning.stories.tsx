import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@zeroxsolutions/ui/components/chat/reasoning';

const THOUGHT = `Let me work through this.

1. The user wants a landing page.
2. I'll start with the hero, then the feature grid.

\`\`\`ts
const sections = ['hero', 'features', 'cta'];
\`\`\`

That ordering keeps the primary action above the fold.`;

/**
 * `Reasoning` is a collapsible disclosure for an agent's thinking trace, built on
 * the SDK `Collapsible`. It auto-opens while `streaming` and auto-collapses about
 * a second after the stream ends, with the trigger reading "Thinking…" then
 * "Thought for N seconds". Compose `ReasoningTrigger` (the labelled toggle) with
 * `ReasoningContent`, which renders its markdown-string child.
 */
const meta: Meta<typeof Reasoning> = {
  title: 'Chat/Reasoning',
  component: Reasoning,
};
export default meta;

type Story = StoryObj<typeof Reasoning>;

/**
 * The live state: `streaming` keeps the panel open and the trigger pulsing on
 * "Thinking…", modelling a reasoning trace as it arrives.
 */
export const Streaming: Story = {
  render: () => (
    <div className="max-w-xl">
      <Reasoning streaming>
        <ReasoningTrigger />
        <ReasoningContent>{THOUGHT}</ReasoningContent>
      </Reasoning>
    </div>
  ),
};

/**
 * The settled, post-stream state: `defaultOpen` shows the panel expanded with the
 * full thought and a static, non-pulsing trigger label.
 */
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
