import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search } from 'lucide-react';

import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolState,
} from '@zeroxsolutions/ui/tool';

const meta: Meta<typeof Tool> = {
  title: 'AI Elements/Tool',
  component: Tool,
};
export default meta;

type Story = StoryObj<typeof Tool>;

export const Completed: Story = {
  render: () => (
    <div className="max-w-lg">
      <Tool defaultOpen>
        <ToolHeader
          state="output-available"
          title="search"
          subtitle="design tokens · 3 results"
          icon={Search}
        />
        <ToolContent>
          <ToolInput input={{ query: 'design tokens', limit: 3 }} />
          <ToolOutput output={{ hits: ['color', 'space', 'radius'] }} />
        </ToolContent>
      </Tool>
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div className="max-w-lg">
      <Tool defaultOpen>
        <ToolHeader state="output-error" title="fetch_page" />
        <ToolContent>
          <ToolInput input={{ url: 'https://x.test' }} />
          <ToolOutput
            output={undefined}
            errorText="Request timed out after 30s"
          />
        </ToolContent>
      </Tool>
    </div>
  ),
};

export const States: Story = {
  name: 'All states (collapsed)',
  render: () => (
    <div className="flex max-w-lg flex-col gap-2">
      {(
        [
          'input-streaming',
          'input-available',
          'output-available',
          'output-error',
        ] as ToolState[]
      ).map((state) => (
        <Tool key={state}>
          <ToolHeader state={state} title={state} />
        </Tool>
      ))}
    </div>
  ),
};
