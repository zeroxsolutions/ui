import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search } from 'lucide-react';

import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolState,
} from '@zeroxsolutions/ui/components/chat/tool';

/**
 * `Tool` renders a collapsible tool-invocation card: a header row (icon, title,
 * optional subtitle, status badge, chevron) over a content area showing the
 * call's JSON `ToolInput` and `ToolOutput`. It is presentational — the host maps
 * its dispatcher lifecycle onto a `ToolState` (`input-streaming` →
 * `input-available` → `output-available` / `output-error`) and supplies the
 * title, icon, input, and output. Compose `ToolHeader` plus a `ToolContent` that
 * wraps `ToolInput`/`ToolOutput` inside a `Tool`.
 */
const meta: Meta<typeof Tool> = {
  title: 'Chat/Tool',
  component: Tool,
};
export default meta;

type Story = StoryObj<typeof Tool>;

/**
 * A successful call: an open card whose `output-available` header carries a
 * subtitle and custom icon, with parameters and a JSON result in the body.
 */
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

/**
 * A failed call: the `output-error` state renders `errorText` in a destructive
 * banner in place of a result.
 */
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

/**
 * All four `ToolState` values rendered as collapsed header-only cards, showing
 * each state's status icon, tone, and label.
 */
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
